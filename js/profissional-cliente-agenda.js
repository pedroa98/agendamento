document.addEventListener('DOMContentLoaded', async () => {
  const user = await ensureSession();
  if (!user) {
    alert('Você precisa estar logado.');
    window.location.href = 'login.html';
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const profId = params.get('id');
  const perfilEl = document.getElementById('perfilProfissional');
  const calendarEl = document.getElementById('calendar');
  const mensagemEl = document.getElementById('mensagem');

  if (!profId) {
    perfilEl.innerHTML = '<p>Nenhum profissional selecionado.</p>';
    return;
  }

  // Modal elements
  const modalMarcar = document.getElementById('modalMarcar');
  const textoData = document.getElementById('textoData');
  const confirmarMarcar = document.getElementById('confirmarMarcar');
  const cancelarMarcar = document.getElementById('cancelarMarcar');

  const modalCancelar = document.getElementById('modalCancelar');
  const textoCancelar = document.getElementById('textoCancelar');
  const confirmarCancelar = document.getElementById('confirmarCancelar');
  const fecharCancelar = document.getElementById('fecharCancelar');

  let selectedSlot = null;
  let selectedAppointment = null;
  let calendar = null;
  let prof = null;
  let clientProfile = null;
  let relation = null; // ProfessionalClientRelation

  try {
    // Load professional profile
    const Prof = Parse.Object.extend('ProfessionalProfile');
    const profQ = new Parse.Query(Prof);
    prof = await profQ.get(profId);

    // Render profile header
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

    perfilEl.innerHTML = `
      <img src="${photoUrlFor(prof) || 'https://via.placeholder.com/150'}" alt="Foto">
      <h2>${prof.get('name')}</h2>
      <p>${prof.get('description') || ''}</p>
      <p>💰 ${prof.get('price') ? 'R$ ' + prof.get('price').toFixed(2) : 'Preço não informado'}</p>
      <p>📍 ${prof.get('address') || 'Endereço não informado'}</p>
    `;

    // Determine client profile
    const ClientProfile = Parse.Object.extend('ClientProfile');
    const clientQ = new Parse.Query(ClientProfile);
    clientQ.equalTo('user', user);
    clientProfile = await clientQ.first();

    // If client has profile, check relation
    if (clientProfile) {
      const Relation = Parse.Object.extend('ProfessionalClientRelation');
      const relQ = new Parse.Query(Relation);
      relQ.equalTo('professional', prof);
      relQ.equalTo('client', clientProfile);
      relation = await relQ.first();
    }

    // Show action buttons depending on state
    const actions = document.createElement('div');
    actions.style.marginTop = '12px';

    if (!clientProfile) {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = 'Cadastrar Perfil';
      btn.addEventListener('click', () => window.location.href = 'editar-perfil-cliente.html');
      actions.appendChild(btn);
      perfilEl.appendChild(actions);
      mensagemEl.textContent = 'Você precisa criar seu perfil para solicitar vínculo ou agendar.';
    } else if (!relation) {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = 'Solicitar Vínculo';
      btn.addEventListener('click', async () => {
        const texto = prompt('Mensagem para o profissional (opcional):', 'Olá, gostaria de me vincular.');
        const Interesse = Parse.Object.extend('Interesse');
        const i = new Interesse();
        i.set('client', clientProfile);
        i.set('professional', prof);
        i.set('message', texto || '');
        await i.save();
        alert('Interesse enviado ao profissional.');
      });
      actions.appendChild(btn);
      perfilEl.appendChild(actions);
      mensagemEl.textContent = 'Você pode solicitar vínculo com este profissional.';
    } else {
      // Client is linked — show agenda and booking options
      mensagemEl.textContent = '';
      perfilEl.appendChild(actions);

      // Initialize FullCalendar
      if (window.FullCalendar) initCalendar();
      else {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.js';
        s.onload = initCalendar;
        document.head.appendChild(s);
      }
    }

  } catch (err) {
    console.error(err);
    perfilEl.innerHTML = '<p>Erro ao carregar o profissional.</p>';
    return;
  }

  // Calendar initialization + event handlers
  async function initCalendar() {
    calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'timeGridWeek',
      locale: 'pt-br',
      allDaySlot: false,
      selectable: true,
      selectMirror: true,
      height: 'auto',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      select: onSelectSlot,
      eventClick: onEventClick,
      events: await carregarEventos()
    });

    calendar.render();
  }

  // Load appointments for this professional
  async function carregarEventos() {
    const Appointment = Parse.Object.extend('Appointment');
    const q = new Parse.Query(Appointment);
    q.equalTo('professional', prof);
    q.include('client');
    q.ascending('date');
    const results = await q.find();
    return results.map(a => ({
      id: a.id,
      title: `Consulta - ${a.get('client') ? (a.get('client').get ? a.get('client').get('name') : a.get('client').name) : 'Cliente'}`,
      start: a.get('date'),
      end: a.get('endDate') || new Date(new Date(a.get('date')).getTime() + 30*60000),
      extendedProps: { appointmentObj: a }
    }));
  }

  function onSelectSlot(selectionInfo) {
    if (!relation) {
      alert('Você precisa estar vinculado a este profissional para agendar.');
      calendar.unselect();
      return;
    }

    // Check available credits
    const pagas = relation.get('sessionsPaid') || 0;
    const usadas = relation.get('sessionsUsed') || 0;
    const disponiveis = pagas - usadas;
    if (disponiveis <= 0) {
      alert('Você não possui créditos disponíveis. Peça ao profissional para adicionar créditos.');
      calendar.unselect();
      return;
    }

    // Check overlap with existing events client-side — FullCalendar select won't pick occupied ranges
    selectedSlot = selectionInfo;
    const start = selectionInfo.start;
    const end = selectionInfo.end;
    textoData.textContent = `Deseja confirmar o agendamento para ${start.toLocaleString()} - ${end.toLocaleString()}?`;
    modalMarcar.style.display = 'flex';
  }

  confirmarMarcar.addEventListener('click', async () => {
    if (!selectedSlot) return;
    try {
      // Create Appointment
      const Appointment = Parse.Object.extend('Appointment');
      const a = new Appointment();
      a.set('professional', prof);
      a.set('client', clientProfile);
      a.set('date', selectedSlot.start);
      a.set('endDate', selectedSlot.end);
      await a.save();

      // decrement credit (sessionsPaid - sessionsUsed)
      relation.increment('sessionsUsed', 1);
      await relation.save();

      modalMarcar.style.display = 'none';
      selectedSlot = null;
      // refresh calendar
      calendar.refetchEvents();
      alert('Consulta agendada com sucesso!');
    } catch (err) {
      console.error('Erro criando appointment', err);
      alert('Erro ao agendar. Tente novamente.');
    }
  });

  cancelarMarcar.addEventListener('click', () => {
    modalMarcar.style.display = 'none';
    selectedSlot = null;
  });

  function onEventClick(info) {
    const ev = info.event;
    selectedAppointment = ev.extendedProps && ev.extendedProps.appointmentObj;
    if (!selectedAppointment) return;

    const start = new Date(ev.start);
    textoCancelar.textContent = `Deseja cancelar a consulta marcada para ${start.toLocaleString()}?`;
    modalCancelar.style.display = 'flex';
  }

  confirmarCancelar.addEventListener('click', async () => {
    if (!selectedAppointment) return;
    try {
      const appt = await (new Parse.Query('Appointment')).get(selectedAppointment.id);
      const apptDate = new Date(appt.get('date'));
      const now = new Date();
      const diffMs = apptDate - now;
      const hours = diffMs / (1000*60*60);

      // If >=72 hours, refund credit (decrement sessionsUsed)
      if (hours >= 72) {
        // decrement sessionsUsed
        relation.increment('sessionsUsed', -1);
        await relation.save();
      }

      await appt.destroy();
      modalCancelar.style.display = 'none';
      selectedAppointment = null;
      calendar.refetchEvents();
      alert('Consulta cancelada.');
    } catch (err) {
      console.error('Erro cancelando consulta', err);
      alert('Erro ao cancelar.');
    }
  });

  fecharCancelar.addEventListener('click', () => {
    modalCancelar.style.display = 'none';
    selectedAppointment = null;
  });

});
