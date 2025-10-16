document.addEventListener("DOMContentLoaded", async () => {
  const user = await ensureSession();
  if (!user) {
    alert("Você precisa estar logado.");
    window.location.href = "login.html";
    return;
  }

  if (user.get("role") !== "profissional") {
    alert("Acesso negado.");
    window.location.href = "login.html";
    return;
  }

  const lista = document.getElementById("listaClientes");
  const mensagem = document.getElementById("mensagem");

  try {
    mensagem.textContent = "Carregando seus clientes...";

    const profQuery = new Parse.Query("ProfessionalProfile");
    profQuery.equalTo("user", user);
    const prof = await profQuery.first();
    if (!prof) {
      mensagem.textContent = "Você ainda não configurou seu perfil profissional.";
      return;
    }

    const Relation = Parse.Object.extend("ProfessionalClientRelation");
    const query = new Parse.Query(Relation);
    query.equalTo("professional", prof);
    query.equalTo("status", "ativo");
    query.include("client");
    const relations = await query.find();

    if (relations.length === 0) {
      mensagem.textContent = "Você ainda não possui clientes.";
      return;
    }

    mensagem.textContent = "";
    lista.innerHTML = "";

    function photoUrlFor(obj) {
      try {
        if (obj && typeof obj.get === 'function') {
          const pu = obj.get('photoUrl');
          if (pu) return pu;
          const pf = obj.get('photo');
          if (pf && typeof pf.url === 'function') return pf.url();
          if (pf && pf.url) return pf.url;
        }
        if (obj && obj.photoUrl) return obj.photoUrl;
        if (obj && obj.photo && obj.photo.url) return obj.photo.url;
      } catch (e) {}
      return null;
    }

    relations.forEach(rel => {
      const client = rel.get("client");
      const nome = (client && typeof client.get === 'function') ? client.get("name") : (client && client.name) || 'Cliente';
      const telefone = (client && typeof client.get === 'function') ? (client.get("phone") || "Não informado") : (client && client.phone) || "Não informado";
      const idade = calcIdade((client && typeof client.get === 'function') ? client.get("birthDate") : (client && client.birthDate));
      const foto = photoUrlFor(client) || "https://via.placeholder.com/100";

      const pagas = rel.get("sessionsPaid") || 0;
      const usadas = rel.get("sessionsUsed") || 0;
      const disponiveis = pagas - usadas;

      const card = document.createElement("div");
      card.className = "cliente-card";
      card.innerHTML = `
        <img src="${foto}" alt="${nome}">
        <h3>${nome}</h3>
        <p>📞 ${telefone}</p>
        <p>🎂 ${idade ? idade + " anos" : "Idade não informada"}</p>
        <p>💰 Sessões: ${usadas}/${pagas} (${disponiveis} disponíveis)</p>
        <button class="btn btn-green btn-add">Adicionar Crédito</button>
        <button class="btn btn-blue btn-notes">Anotações</button>
        <button class="btn btn-red btn-encerrar">Encerrar</button>
      `;

      card.querySelector(".btn-add").addEventListener("click", async () => {
        const add = parseInt(prompt("Quantas novas sessões pagas deseja adicionar?"), 10);
        if (!isNaN(add) && add > 0) {
          rel.increment("sessionsPaid", add);
          await rel.save();
          alert(`+${add} sessões adicionadas!`);
          location.reload();
        }
      });

      card.querySelector(".btn-notes").addEventListener("click", async () => {
        const atual = rel.get("notes") || "";
        const texto = prompt("Observações sobre o cliente:", atual);
        if (texto !== null) {
          rel.set("notes", texto);
          await rel.save();
          alert("Anotações salvas!");
        }
      });

      card.querySelector(".btn-encerrar").addEventListener("click", async () => {
        if (confirm(`Encerrar vínculo com ${nome}?`)) {
          rel.set("status", "encerrado");
          await rel.save();
          card.remove();
        }
      });

      lista.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    mensagem.textContent = "Erro ao carregar lista de clientes.";
  }

  function calcIdade(data) {
    if (!data) return null;
    const hoje = new Date();
    const nasc = new Date(data);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
  }
});