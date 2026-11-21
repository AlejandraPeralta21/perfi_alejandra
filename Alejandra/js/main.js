/* Datos editables de salas e indicadores, modal de artista y arranque.
   La lógica de acceso está en auth.js y la de reservas en reservas.js. */
(function ($) {
  const KT = window.KT;

  // Valores demostrativos: edítalos aquí.
  KT.STATS = { rooms: '4', songs: '+1.200', rating: '4.9' };
  // Pega los enlaces compartidos de las fotos entre las comillas vacías.
  const ROOM_IMAGES = {
    premium: 'https://www.dropbox.com/scl/fi/9ho3lnpqdvbxot7w0r020/salapremium.webp?rlkey=027ax4xpwwt1a1e11xt22tmsu&st=d1030hh5&dl=0',
    vip: 'https://www.dropbox.com/scl/fi/3k53zjgm406cy202btkpk/salavip.webp?rlkey=8475nhag78em0monsfz627o0j&st=mye2bonw&dl=0',
    party: 'https://www.dropbox.com/scl/fi/awdlgwi9rdg94pf9dmv90/party.webp?rlkey=2n224crgwtrujce20hqvk976n&st=u7psucqt&dl=0',
    gold: 'https://www.dropbox.com/scl/fi/k9qk82x4jl8yfn7qp4p8n/salaparty.webp?rlkey=whg1yb07yfrwhyjy54bxdhvu6&st=z076n35u&dl=0'
  };
  const roomImage = id => {
    let url = ROOM_IMAGES[id] || `js/assets/salas/${id}.jpg`;
    if (/dropbox\.com/i.test(url)) {
      url = url.replace(/[?&](?:dl|raw)=[^&]*/gi, '');
      url += (url.includes('?') ? '&' : '?') + 'raw=1';
    }
    return url;
  };
  KT.ROOMS = [
    { id: 'premium', name: 'Sala Premium', light: 'morada', min: 6, max: 8, price: 65, color: '#7a2cff', img: roomImage('premium') },
    { id: 'vip', name: 'Sala VIP', light: 'azul', min: 8, max: 12, price: 100, color: '#2a52ff', img: roomImage('vip') },
    { id: 'party', name: 'Sala Party', light: 'roja', min: 12, max: 20, price: 120, color: '#ff2a3d', img: roomImage('party') },
    { id: 'gold', name: 'Sala Gold', light: 'dorada', min: 4, max: 6, price: 85, color: '#d4af37', img: roomImage('gold') }
  ];

  // PUNTO 4 · ANTI-XSS EN SALAS (datos de Supabase):
  // 1) escapeHTML codifica nombre, iluminación, URL y atributos antes de interpolarlos.
  // 2) El color solo acepta hexadecimal y el ID solo letras/números/guion bajo/guion.
  // 3) El enlace de imagen solo permite HTTPS o una ruta local js/assets/; valores no válidos se omiten.
  // Así el contenido de la base no puede inyectar etiquetas, atributos ni CSS en la tarjeta.
  const roomCard = (r, i) => {
    const esc = KT.escapeHTML;
    const id = /^[a-z0-9_-]+$/i.test(String(r.id || '')) ? String(r.id) : '';
    const color = /^#[\da-f]{3,8}$/i.test(String(r.color || '')) ? r.color : '#d4af37';
    const rawImage = String(r.img || '');
    const image = /^https:\/\/[^\s"'<>]+$/i.test(rawImage) || /^js\/assets\/[\w./-]+$/i.test(rawImage) ? rawImage : '';
    const min = Number.isFinite(Number(r.min)) ? Number(r.min) : 1;
    const max = Number.isFinite(Number(r.max)) ? Number(r.max) : min;
    const price = Number.isFinite(Number(r.price)) ? Number(r.price) : 0;
    return `<article class="room" style="--rc:${color};--i:${i}">
      <div class="room__thumbnail">${KT.ic('sofa')}<img class="room__image" src="${esc(image)}" alt="${esc(r.name)} con iluminación ${esc(r.light)}" width="640" height="360" loading="lazy" decoding="async" data-remove-on-error></div>
      <div class="room__info"><h3 class="room__title">${esc(r.name)}</h3>
        <div class="room__meta"><span>${KT.ic('users')}${min} - ${max} personas</span><span>${KT.ic('tag')}${price} Bs / hora</span></div>
        <button class="btn-gold sm" data-reserve="${esc(id)}">${KT.ic('calendar')}Reservar</button></div></article>`;
  };
  KT.renderRooms = function () { $('#homeRooms,#roomsAll').html((KT.ROOMS || []).map(roomCard).join('')); };

  /* Modal de artista */
  KT.openArtist = id => {
    const a = KT.ARTISTS.find(x => x.id === id);
    if (!a) return;
    $('#aPic').css({ '--c1': a.c1, '--c2': a.c2 }).html(`<span class="ini">${KT.initials(a.name)}</span><img src="${a.img}" alt="Foto ampliada de ${a.name}" width="1200" height="900" decoding="async" data-remove-on-error>`);
    $('#aName').text(a.name);
    $('#aGenre').text(a.genre);
    $('#aDesc').text(a.desc);
    KT.openModal('#artistModal');
  };

  $(function () {
    $('[data-stat]').each(function () { $(this).text(KT.STATS[$(this).data('stat')]); });
    KT.renderRooms();
    KT.initFilters();
    KT.refresh();
    KT.initNav();
    KT.loadAsyncTracks();
  });
})(jQuery);




