document.addEventListener('DOMContentLoaded', async () => {
	const user = await ensureSession('estabelecimento');
	if (!user) return;

	const lista = document.getElementById('lista-interesses');
	const msg = document.getElementById('mensagem');

	try {
		const EstablishmentProfile = Parse.Object.extend('EstablishmentProfile');
		const estQ = new Parse.Query(EstablishmentProfile);
		estQ.equalTo('user', user);
		const est = await estQ.first();
		if (!est) { if (msg) msg.textContent = 'Perfil de estabelecimento não encontrado.'; return; }

		const Interesse = Parse.Object.extend('Interesse');
		const iq = new Parse.Query(Interesse);
		iq.equalTo('establishment', est);
		iq.descending('createdAt');
		iq.include('client');
		const interesses = await iq.find();

		if (!interesses || interesses.length === 0) { lista.innerHTML = '<li>Nenhuma solicitação.</li>'; return; }

		lista.innerHTML = '';
		interesses.forEach(i => {
			const li = document.createElement('li');
			const client = i.get('client');
			const nome = client ? (client.get ? client.get('name') : client.name) : 'Cliente';
			li.innerHTML = `<strong>${nome}</strong> - ${i.get('message') || ''} <button data-id="${i.id}" class="btn-aceitar">Aceitar</button> <button data-id="${i.id}" class="btn-rejeitar">Rejeitar</button>`;
			lista.appendChild(li);
		});

		lista.querySelectorAll('.btn-aceitar').forEach(b => b.addEventListener('click', async (ev) => {
			const id = ev.target.getAttribute('data-id');
			await aceitarInteresse(id);
			location.reload();
		}));

		lista.querySelectorAll('.btn-rejeitar').forEach(b => b.addEventListener('click', async (ev) => {
			const id = ev.target.getAttribute('data-id');
			await rejeitarInteresse(id);
			location.reload();
		}));

	} catch (err) {
		console.error(err);
		if (msg) msg.textContent = 'Erro ao carregar interesses.';
	}

	async function aceitarInteresse(id) {
		const Interesse = Parse.Object.extend('Interesse');
		const i = await new Parse.Query(Interesse).get(id);
		// criar relação EstablishmentClientRelation
		const Relation = Parse.Object.extend('EstablishmentClientRelation');
		const r = new Relation();
		r.set('establishment', i.get('establishment'));
		r.set('client', i.get('client'));
		r.set('status', 'ativo');
		await r.save();
		// remover interesse ou marcar como atendido
		await i.destroy();
	}

	async function rejeitarInteresse(id) {
		const Interesse = Parse.Object.extend('Interesse');
		const i = await new Parse.Query(Interesse).get(id);
		await i.destroy();
	}

});
