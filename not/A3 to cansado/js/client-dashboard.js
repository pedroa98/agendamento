document.addEventListener("DOMContentLoaded", async () => {
  const user = await ensureSession();
  if (!user) {
    alert("Você precisa estar logado para acessar o dashboard.");
    window.location.href = "login.html";
    return;
  }
  if (user.get("role") !== "cliente") {
    alert("Acesso negado. Apenas clientes podem acessar este painel.");
    window.location.href = "login.html";
    return;
  }

  const listaNotificacoes = document.getElementById("listaNotificacoes");
  const mensagem = document.getElementById("mensagem");
  const btnMarcarTodas = document.getElementById("btnMarcarTodas");
  const btnRemoverLidas = document.getElementById("btnRemoverLidas");

  // Recupera o perfil do cliente
  const ClientProfile = Parse.Object.extend("ClientProfile");
  const cpQuery = new Parse.Query(ClientProfile);
  // Prefer SDK lookup; if user is a REST-backed object this may return null — then try REST fallback
  cpQuery.equalTo("user", user);
  let clientProfile = await cpQuery.first();

  if (!clientProfile) {
    // REST fallback: try to find ClientProfile by user id via REST API when we have a session token
    try {
      const cfg = window.PARSE_CONFIG;
      if (cfg && user && (user.__sessionToken || (user.get && user.get('sessionToken')) || user.sessionToken)) {
        const userId = user.id || (user.objectId) || (user.get && user.get('objectId')) || (user.get && user.get('id'));
        if (userId) {
          const where = encodeURIComponent(JSON.stringify({ user: { __type: 'Pointer', className: '_User', objectId: userId } }));
          const res = await fetch(`${cfg.serverURL}/classes/ClientProfile?where=${where}&limit=1`, {
            headers: { 'X-Parse-Application-Id': cfg.appId, 'X-Parse-JavaScript-Key': cfg.jsKey, 'X-Parse-Session-Token': user.__sessionToken }
          });
          if (res.ok) {
            const d = await res.json();
            if (d.results && d.results.length) clientProfile = d.results[0];
          }
        }
      }
    } catch (e) {
      console.warn('REST fallback to fetch ClientProfile failed:', e);
    }
  }

  if (!clientProfile) {
    mensagem.textContent = "Você ainda não completou seu perfil. Vá em 'Editar Perfil'.";
    return;
  }

  // Renderiza o calendário (igual antes)
  await inicializarAgenda(clientProfile);

  // Carrega notificações
  await carregarNotificacoes();

  // Ações em massa
  btnMarcarTodas.addEventListener("click", async () => {
    try {
      const notifs = await buscarTodas();
      const pendentes = notifs.filter(n => n.get("status") !== "lida");
      await Parse.Object.saveAll(
        pendentes.map(n => { n.set("status", "lida"); return n; })
      );
      await carregarNotificacoes();
    } catch (e) {
      console.error(e);
      alert("Erro ao marcar todas como lidas.");
    }
  });

  btnRemoverLidas.addEventListener("click", async () => {
    try {
      const notifs = await buscarTodas();
      const lidas = notifs.filter(n => n.get("status") === "lida");
      await Parse.Object.destroyAll(lidas);
      await carregarNotificacoes();
    } catch (e) {
      console.error(e);
      alert("Erro ao remover notificações lidas.");
    }
  });

  // ---------- Funções ----------
  async function inicializarAgenda(clientProfile) {
    const calendarEl = document.getElementById("calendar");
    const Appointment = Parse.Object.extend("Appointment");
    const query = new Parse.Query(Appointment);
    query.equalTo("client", clientProfile);
    query.include("professional");

    const results = await query.find();

    const eventos = results.map(a => {
      const prof = a.get("professional");
      const nomeProf = prof ? prof.get("name") : "Profissional";
      const status = a.get("status") || "pendente";
      const cor = status === "aceito" ? "#2ecc71" : "#f39c12";
      return { title: `${nomeProf} (${status})`, start: a.get("date"), backgroundColor: cor };
    });

    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: "timeGridWeek",
      locale: "pt-br",
      allDaySlot: false,
      height: "auto",
      headerToolbar: { left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" },
      events: eventos,
    });
    calendar.render();
  }

  async function buscarTodas() {
    // If clientProfile is a Parse.Object (has get), use SDK; otherwise use REST
    if (clientProfile && typeof clientProfile.get === 'function') {
      console.log('buscarTodas: using SDK to fetch Notificacao for clientProfile', clientProfile.id || clientProfile.objectId);
      const Notificacao = Parse.Object.extend("Notificacao");
      const q = new Parse.Query(Notificacao);
      q.equalTo("client", clientProfile);
      q.include("professional");
      q.descending("createdAt");
      q.limit(100); // ajuste se precisar de paginação
      return await q.find();
    }

    // REST path: clientProfile is a plain object (from REST). Fetch notifications via REST and return thin wrappers
    try {
      const cfg = window.PARSE_CONFIG;
      const where = encodeURIComponent(JSON.stringify({ client: { __type: 'Pointer', className: 'ClientProfile', objectId: clientProfile.objectId || clientProfile.id } }));
      const url = `${cfg.serverURL}/classes/Notificacao?where=${where}&include=professional&order=-createdAt&limit=100`;
      console.log('buscarTodas: REST fetching Notificacao URL=', url);
      const res = await fetch(url, { headers: { 'X-Parse-Application-Id': cfg.appId, 'X-Parse-JavaScript-Key': cfg.jsKey, 'X-Parse-Session-Token': clientProfile.__sessionToken || (user && user.__sessionToken) } });
      if (!res.ok) {
        const text = await res.text().catch(()=>null);
        console.error('buscarTodas: REST fetch returned', res.status, text);
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      console.log('buscarTodas: REST returned', (data.results && data.results.length) || 0, 'notifications');
      // Map REST results to a simple wrapper that exposes get(), id, createdAt and helper save/destroy using REST
      return data.results.map(r => {
        const wrapper = {
          id: r.objectId,
          createdAt: new Date(r.createdAt),
          _raw: r,
          get: (k) => {
            if (k === 'professional') return r.professional; // REST object
            return r[k];
          },
          set: (k, v) => { r[k] = v; },
          save: async function() {
            const cfg = window.PARSE_CONFIG;
            const res = await fetch(`${cfg.serverURL}/classes/Notificacao/${this.id}`, {
              method: 'PUT',
              headers: { 'X-Parse-Application-Id': cfg.appId, 'X-Parse-JavaScript-Key': cfg.jsKey, 'X-Parse-Session-Token': clientProfile.__sessionToken || (user && user.__sessionToken), 'Content-Type': 'application/json' },
              body: JSON.stringify(this._raw)
            });
            if (!res.ok) throw new Error(`Failed to save notification: ${res.status}`);
            const d = await res.json();
            Object.assign(this._raw, d);
          },
          destroy: async function() {
            const cfg = window.PARSE_CONFIG;
            const res = await fetch(`${cfg.serverURL}/classes/Notificacao/${this.id}`, {
              method: 'DELETE',
              headers: { 'X-Parse-Application-Id': cfg.appId, 'X-Parse-JavaScript-Key': cfg.jsKey, 'X-Parse-Session-Token': clientProfile.__sessionToken || (user && user.__sessionToken) }
            });
            if (!res.ok) throw new Error(`Failed to delete notification: ${res.status}`);
          }
        };
        return wrapper;
      });
    } catch (e) {
      console.error('Erro REST ao buscar notificacoes:', e);
      return [];
    }
  }

  async function carregarNotificacoes() {
    try {
      mensagem.textContent = "Carregando notificações...";
      listaNotificacoes.innerHTML = "";

      const results = await buscarTodas();

      if (results.length === 0) {
        mensagem.textContent = "Nenhuma notificação.";
        return;
      }
      mensagem.textContent = "";

      for (const notif of results) {
        const prof = notif.get("professional");
        const nomeProf = prof ? prof.get("name") : "Profissional";
        const msg = notif.get("message");
        const tipo = notif.get("type");
        const data = notif.createdAt.toLocaleString("pt-BR");
        const lida = notif.get("status") === "lida";

        const div = document.createElement("div");
        div.className = "notificacao" + (lida ? " lida" : "");
        div.dataset.id = notif.id;
        div.innerHTML = `
          <h4>${tipo === "aceito" ? "✅ Aceito" : "🚫 Recusado"} - ${nomeProf}</h4>
          <p>${msg}</p>
          <small>${data}</small>
          <div class="notif-actions">
            <button class="btn-secondary btn-marcar">${lida ? "Marcar como não lida" : "Marcar como lida"}</button>
            <button class="btn-danger btn-remover">Remover</button>
          </div>
        `;

        // Ações individuais
        div.querySelector(".btn-marcar").addEventListener("click", async () => {
          try {
            notif.set("status", lida ? "nova" : "lida");
            await notif.save();
            await carregarNotificacoes(); // re-render para refletir estado
          } catch (e) {
            console.error(e);
            alert("Erro ao atualizar status da notificação.");
          }
        });

        div.querySelector(".btn-remover").addEventListener("click", async () => {
          try {
            await notif.destroy();
            div.remove();
            if (!listaNotificacoes.children.length) mensagem.textContent = "Nenhuma notificação.";
          } catch (e) {
            console.error(e);
            alert("Erro ao remover notificação.");
          }
        });

        listaNotificacoes.appendChild(div);
      }
    } catch (e) {
      console.error("Erro ao carregar notificações:", e);
      mensagem.textContent = "Erro ao carregar notificações.";
    }
  }
});