/* ALEJANDRA SPACE · categories.js
   EJECUCIÓN: hilo principal del navegador; src/js/app.js lo importa después de jQuery y main.js.
   INICIO: DOM listo; importa checkImages desde main.js y delega clicks en los contenedores de categorías.
   Categorías → subcategorías → contenido, sin recargar la página.
   Todo el texto se inserta con .text() (sin HTML externo). Edita DATA para personalizar. */
import { checkImages } from './main.js';

(function ($) {
  'use strict';

  const DATA = {
    musica: {
      name: 'Música', icon: 'bi-headphones',
      subs: [
        { id: 'artistas', name: 'Artistas favoritos', icon: 'bi-star',
          text: 'Mis artistas favoritos son Shawn Mendes, Taylor Swift, Morat, Jorge Cuéllar y muchos más.',
          items: [
            { n: 'Shawn Mendes', d: 'Cantautor canadiense de pop, con baladas y letras muy personales.', img: 'https://www.dropbox.com/scl/fi/mmpmpghpmi7ncar3ekipv/shawmendesadentro.webp?rlkey=52wdhcof2hj3o9c3i14zjwkcr&st=p4ny4r7w&raw=1', songs: ['Treat You Better', 'Stitches', 'There’s Nothing Holdin’ Me Back'] },
            { n: 'Taylor Swift', d: 'Cantautora estadounidense que cuenta historias en cada canción.', img: 'https://www.dropbox.com/scl/fi/wmh4ws2xsdhp9g8z4j4xw/tylor.webp?rlkey=u67nli9iyydor685a073gzr4y&st=i29zrspg&raw=1', songs: ['Style', 'Daylight', 'Cruel Summer'] },
            { n: 'Morat', d: 'Banda de pop con letras románticas para cantar a coro.', img: 'https://www.dropbox.com/scl/fi/wh1t496gishozls3on0xl/morat.webp?rlkey=x1a6d2cuq1817amscqr9apkgo&st=l1jx6pmj&raw=1', songs: ['No Se Va', 'Besos en Guerra', 'Cuando Nadie Ve'] },
            { n: 'Jorge Cuéllar', d: 'Uno de mis artistas favoritos.', img: 'https://www.dropbox.com/scl/fi/68fnblkiws8w0ublqjmhc/jorgecuellar.webp?rlkey=ubx959zdmpp05iwybwy6wokdk&st=m6xcap4w&raw=1', songs: ['IMU', 'YUANFEN', 'Ayayay'] },
            { n: 'Tiago PZK', d: 'Uno de los artistas que disfruto escuchar.', img: 'https://www.dropbox.com/scl/fi/ecgrac4adkogbfm9c7lqq/tiago.webp?rlkey=rvozyekq299wsaik4k6a2ez8j&st=5o2rdvoa&raw=1', songs: ['Entre Nosotros', 'Que se parezca a ti', 'Por amarte a ti'] },
            { n: 'Kea', d: 'También forma parte de mis artistas favoritos.', img: 'https://www.dropbox.com/scl/fi/5ueczx548ko1gkh26eitx/khea.webp?rlkey=7xneqqrs8o3ljps0rpzzcxik9&st=6vayogry&raw=1', songs: ['Mi señora', 'Hola perdida'] },
            { n: 'Nicki Nicole', d: 'Una de las artistas que escucho.', img: 'https://www.dropbox.com/scl/fi/e5tlvoell32zcziwmunop/nickinicole.webp?rlkey=hpctemvgzk8qmlf2wdy651lfg&st=9gykz0cr&raw=1', songs: ['Ojos verdes', 'Otra noche', 'Mamichula'] },
            { n: 'Camilo', d: 'Me gusta escuchar sus canciones.', img: 'https://www.dropbox.com/scl/fi/9n5buy1a2er0gl1bygrh6/camilo.webp?rlkey=4948jhrgf2bw9jdmh1n86u87h&st=geb89li4&raw=1', songs: ['Vida de Rico', 'Tutu', 'Favorito'] },
            { n: 'Wisin & Yandel', d: 'También disfruto su música.', img: 'https://www.dropbox.com/scl/fi/l79kzy680gl1xx6masmgn/wisin-y-yandel.webp?rlkey=455mhpxvcx610uktbrzfe1ku9&st=p8wp5po4&raw=1', songs: ['Rakata', 'Abusadora', 'Algo Me Gusta de Ti'] }
          ] },
        { id: 'pop', name: 'Pop', icon: 'bi-music-note-beamed',
          text: 'Además de mis favoritos, escucho música variada según mi ánimo.',
          items: [
            { n: 'Música para cada momento', d: 'Me gusta descubrir canciones y escuchar distintos estilos.', img: 'https://www.dropbox.com/scl/fi/c9z6bk5otbdnceji90t9f/michael.webp?rlkey=oj4tge7710pzn41rx1ma1mw6m&st=jfvtj51s&raw=1', songs: [{ title: 'Human Nature', artist: 'Michael Jackson' }, { title: 'Bad', artist: 'Michael Jackson' }, { title: 'Billie Jean', artist: 'Michael Jackson' }] },
            { n: 'Nuevos descubrimientos', d: 'Siempre hay espacio para encontrar artistas y canciones nuevas.', img: 'https://www.dropbox.com/scl/fi/92z7up8e5bwrcky8a7b7t/musica.webp?rlkey=w5togldjxsng3si83kn4ogim9&st=47rqyjdp&raw=1', songs: [{ title: 'Casi', artist: 'Jota Narbaja' }, { title: 'La Cita', artist: 'Explosión Cumbiera' }, { title: 'El Teléfono', artist: 'Explosión Cumbiera' }, { title: 'Un Solo Motivo', artist: 'Explosión Cumbiera' }] }
          ] },
        { id: 'romantica', name: 'Música romántica', icon: 'bi-heart-fill',
          text: 'Canciones con historias y sentimientos.',
          items: [
            { n: 'Baladas', d: 'Letras que se quedan en la cabeza.', img: 'https://www.dropbox.com/scl/fi/7lkyk6eu9x80kwmpjyvn4/musica-romatica.webp?rlkey=nup5srk183cbfesxhizdn28vj&st=zfzah7ea&raw=1', songs: [{ title: 'YUANFEN', artist: 'Jorge Cuéllar' }, { title: 'Noviembre Sin Ti', artist: 'Reik' }, { title: 'Creo en Ti', artist: 'Reik' }, { title: 'La Misma Luna', artist: 'Matisse' }, { title: 'Azul', artist: 'Cristian Castro' }] },
            { n: 'Para dedicar', d: 'Canciones que cuentan lo que a veces no se dice.', img: 'https://www.dropbox.com/scl/fi/9lygec0m5c4e9qa27plcy/yuanfen.webp?rlkey=thdzrmixb0fsnetj7q04omeoq&st=39xgcxah&raw=1', songs: [{ title: 'Ya Me Enteré', artist: 'Reik' }, { title: 'Todavía', artist: 'Matisse' }, { title: 'Por Amarte Así', artist: 'Cristian Castro' }] }
          ] },
        { id: 'playlists', name: 'Playlists', icon: 'bi-list-ul',
          text: 'La música que elijo cambia según lo que estoy haciendo.',
          items: [
            { n: 'Para relajarme', d: 'Canciones para disfrutar y descansar.', img: 'https://www.dropbox.com/scl/fi/imqb0st8mniorqu2lz8eg/joseluis.webp?rlkey=bc58tjrhtac8ja0fag90eihqa&st=vals4w8a&raw=1', songs: [{ title: 'Un Velero Llamado Libertad', artist: 'José Luis Perales' }, { title: '¿Y Cómo Es Él?', artist: 'José Luis Perales' }, { title: 'Me Llamas', artist: 'José Luis Perales' }] },
            { n: 'Para animarme', d: 'Música que acompaña mis momentos con energía.', img: 'https://www.dropbox.com/scl/fi/n54fjels8iyh1qtioawm7/entrenar.webp?rlkey=1o6a2xppu964ysixjhv5banh2&st=qp18677j&raw=1', songs: [{ title: 'Pepas', artist: 'Farruko' }, { title: 'Chillax', artist: 'Farruko' }, { title: 'Reggaetón Lento (Bailemos)', artist: 'CNCO' }, { title: 'Hey DJ', artist: 'CNCO' }] }
          ] }
      ]
    },
    videojuegos: {
      name: 'Videojuegos', icon: 'bi-controller',
      subs: [
        { id: 'pvz', name: 'Plants vs. Zombies', icon: 'bi-flower1',
          text: 'Ya completé todos los niveles. Usa los botones para recorrer sus cinco escenarios.',
          items: [
            { n: 'Día', d: 'Niveles 1-1, 1-2, 1-3, 1-4, 1-5, 1-6, 1-7, 1-8, 1-9 y 1-10.', img: 'https://www.dropbox.com/scl/fi/0tr45l2nqfuyofjcrt1gj/pvzdia.webp?rlkey=cs3hmlvpvaljfbninjak06mrc&st=1iz8rmug&raw=1' },
            { n: 'Noche', d: 'Niveles 2-1, 2-2, 2-3, 2-4, 2-5, 2-6, 2-7, 2-8, 2-9 y 2-10.', img: 'https://www.dropbox.com/scl/fi/a4bvyc7m9jwig2gbei17t/pvznoche.webp?rlkey=apb0vmolssnjdx7ojcrybvjkt&st=6d3ghgis&raw=1' },
            { n: 'Piscina', d: 'Niveles 3-1, 3-2, 3-3, 3-4, 3-5, 3-6, 3-7, 3-8, 3-9 y 3-10.', img: 'https://www.dropbox.com/scl/fi/5za40skk57u115af8kao6/pvzpiscina.webp?rlkey=zoj9bdfijlzezw0vayxylp1rv&st=jovnzmj2&raw=1' },
            { n: 'Niebla', d: 'Niveles 4-1, 4-2, 4-3, 4-4, 4-5, 4-6, 4-7, 4-8, 4-9 y 4-10. El 4-5 ocurre de noche.', img: 'https://www.dropbox.com/scl/fi/4equ9ljj4a1qd822rouob/pvzniebla.webp?rlkey=2ja9xqg6txp2j5u9a4zm7j515&st=0xv0m448&raw=1' },
            { n: 'Tejado', d: 'Niveles 5-1, 5-2, 5-3, 5-4, 5-5, 5-6, 5-7, 5-8, 5-9 y 5-10. El 5-10 es en el tejado nocturno.', img: 'https://www.dropbox.com/scl/fi/h6635zibj8wvkzjstpcgh/pvztejado.webp?rlkey=iwv16aduzu1ygjl3j7qgvohpb&st=qkqxpp9k&raw=1' }
          ] },
        { id: 'clash', name: 'Clash Royale', icon: 'bi-shield-shaded',
          text: 'He llegado hasta la Arena 6. Usa los botones para recorrer mi progreso.',
          items: [
            { n: 'Arena 1', d: 'Una de las arenas por las que avancé antes de llegar a la Arena 6.', img: 'https://www.dropbox.com/scl/fi/zhwkc2b2hgf1a7uopg00b/arena1.webp?rlkey=h01egr2anwilp3h2ncbismkpq&st=6ttlnyvj&raw=1' },
            { n: 'Arena 2', d: 'Una de las arenas por las que avancé antes de llegar a la Arena 6.', img: 'https://www.dropbox.com/scl/fi/07gq6f1a0kct9w99fajjt/arena2.webp?rlkey=9w2kz35bt5eyjuh0gk3hymmr6&st=a1aas9g5&raw=1' },
            { n: 'Arena 3', d: 'Una de las arenas por las que avancé antes de llegar a la Arena 6.', img: 'https://www.dropbox.com/scl/fi/p86k687flmujpgpio7ghx/arena3.webp?rlkey=wqqk83lw7j8wzdyrnqm11tmds&st=ftg3yaix&raw=1' },
            { n: 'Arena 4', d: 'Una de las arenas por las que avancé antes de llegar a la Arena 6.', img: 'https://www.dropbox.com/scl/fi/n6hn7vozmo4ox9d9ixr2f/arena4.webp?rlkey=i6oq61qrqi09mkl2qoteaibx4&st=80b5ylsu&raw=1' },
            { n: 'Arena 5', d: 'Una de las arenas por las que avancé antes de llegar a la Arena 6.', img: 'https://www.dropbox.com/scl/fi/zzt4r1xomy7xs4nylp6sg/arena5.webp?rlkey=xiws0qhob8802cihnsojkan0r&st=ywerllww&raw=1' },
            { n: 'Arena 6', d: 'Mi progreso actual: llegué hasta esta arena.', img: 'https://www.dropbox.com/scl/fi/7yd1xskota5bcaih5t1be/arena6.webp?rlkey=x5rhws4ze3iq0qqmof90dj97u&st=zln8tcqn&raw=1' }
          ] },
        { id: 'favoritos', name: 'Mis juegos favoritos', icon: 'bi-trophy',
          text: 'También juego Vice City y Free Fire. En Clash Royale llegué hasta la Arena 6, y ya completé todos los niveles de Plants vs. Zombies.',
          items: [
            { n: 'Vice City', d: 'Un juego de mundo abierto que forma parte de mis favoritos. Voy avanzando por sus misiones.', img: 'https://www.dropbox.com/scl/fi/ormmyau82hgu8clpgghsq/vice.webp?rlkey=wjnb6odrlp1jvnf99ffb4dgki&st=s8j5js05&raw=1' },
            { n: 'Free Fire', d: 'También disfruto jugar partidas de Free Fire.', img: 'https://www.dropbox.com/scl/fi/r7pgptdnwuhgy672z2unn/freefire.webp?rlkey=a6jjmdqpvls6ufya83y1w9w84&st=y5fqn0s3&raw=1' }
          ] },
        { id: 'construccion', name: 'Construcción', icon: 'bi-bricks',
          text: 'También me gusta crear y armar cosas con mis manos.',
          items: [
            { n: 'LEGO', d: 'Me gusta armar modelos y construcciones con piezas LEGO.', img: 'https://www.dropbox.com/scl/fi/mc56p40orx47oxrcnpjv7/lego.webp?rlkey=1g47cm7d9jssaiqkhum9f4nqj&st=jkm3qo3v&raw=1' }
          ] }
      ]
    },
    deportes: {
      name: 'Deportes', icon: 'bi-dribbble',
      subs: [
        { id: 'voleibol', name: 'Voleibol', icon: 'bi-circle',
          text: 'El voleibol es uno de los deportes que practico.',
          items: [
            { n: 'Remate y bloqueo', d: 'La parte más emocionante de cada punto.', img: 'https://www.dropbox.com/scl/fi/ng3r4jsa8a6946gcs6z9j/voley.webp?rlkey=gs19ombgwaplo71s6fvo00s97&st=f0ypzpk2&raw=1' },
            { n: 'Saque y recepción', d: 'La base para ganar el partido.', img: 'https://www.dropbox.com/scl/fi/gl20dtlxpiwsarxana4gd/vaoleysque.webp?rlkey=azbhheb4r8m5bwz6tg9uopdpf&st=9cv8nycc&raw=1' }
          ] },
        { id: 'futsal', name: 'Futsal', icon: 'bi-bullseye',
          text: 'Practico futsal de vez en cuando y disfruto compartir en equipo.',
          items: [
            { n: 'Partidos con amigos', d: 'Velocidad y coordinación en cancha pequeña.', img: 'https://www.dropbox.com/scl/fi/dhhk9fpbai8hgsa8opcfx/futsal.webp?rlkey=didfk8zgbmttpwjcjilm0ye9a&st=e34wms91&raw=1' }
          ] },
        { id: 'natacion', name: 'Natación', icon: 'bi-water',
          text: 'Me gusta nadar y disfrutar de la actividad en el agua.',
          items: [
            { n: 'Nadar', d: 'Una de las actividades que disfruto practicar.', img: 'https://www.dropbox.com/scl/fi/zepxfamfr362xc3s73hom/natacion.webp?rlkey=fxfgiyqv4tfcuym0ebocabayr&st=7cfpw1gy&raw=1' }
          ] },
        { id: 'otros', name: 'Otras actividades', icon: 'bi-stars',
          text: 'También me gusta probar distintas actividades y mantenerme activa.',
          items: [
            { n: 'Probar cosas nuevas', d: 'Disfruto hacer varias actividades además de mis deportes favoritos.', img: 'https://www.dropbox.com/scl/fi/amiehenrpqv9vo49wxnfu/basquet.webp?rlkey=a56zckno57i2ytdo475cbxqup&st=axwhr1dr&raw=1' }
          ] }
      ]
    }
  };

  const ORDER = ['musica', 'videojuegos', 'deportes'];
  let curCat = null, curSub = null, artistIndex = 0;

  function clearDetailTheme() {
    $('#catDetail').removeClass(function (_index, currentClasses) {
      return (currentClasses.match(/(^|\s)theme-[^\s]+/g) || []).join(' ');
    });
  }

  function renderTabs() {
    const $t = $('#catTabs').empty();
    ORDER.forEach(function (key) {
      const c = DATA[key];
      $('<button type="button" class="tab" role="tab"></button>')
        .attr('data-cat', key)
        .append($('<i aria-hidden="true"></i>').addClass('bi ' + c.icon))
        .append($('<span></span>').text(c.name))
        .appendTo($t);
    });
  }

  function renderSubs(catKey) {
    const c = DATA[catKey];
    $('#catTabs .tab').each(function () {
      const on = $(this).data('cat') === catKey;
      $(this).toggleClass('active', on).attr('aria-selected', String(on));
    });
    const $chips = $('#subChips').empty();
    c.subs.forEach(function (s) {
      $('<button type="button" class="subchip"></button>')
        .attr('data-sub', s.id)
        .append($('<i aria-hidden="true"></i>').addClass('bi ' + s.icon))
        .append($('<span></span>').text(s.name))
        .appendTo($chips);
    });
    $('#subTitle').empty()
      .append($('<i aria-hidden="true"></i>').addClass('bi ' + c.icon))
      .append($('<span></span>').text('Subcategorías de ' + c.name));
    $('#catDetail').removeClass('theme-sport-voleibol theme-sport-futsal theme-sport-natacion theme-sport-otros');
  }

  function renderContent(catKey, subId) {
    const sub = DATA[catKey].subs.filter(function (s) { return s.id === subId; })[0];
    if (!sub) return;
    curSub = subId;
    artistIndex = 0;
    $('#subChips .subchip').each(function () {
      const on = $(this).data('sub') === subId;
      $(this).toggleClass('active', on).attr('aria-pressed', String(on));
    });
    const $detail = $('#catDetail');
    clearDetailTheme();
    $detail.addClass('theme-' + catKey + '-' + sub.id);
    if (catKey === 'deportes') $detail.addClass('theme-sport-' + sub.id);
    $('#subTitle').empty()
      .append($('<i aria-hidden="true"></i>').addClass('bi ' + sub.icon))
      .append($('<span></span>').text(sub.name));
    const $c = $('#subContent').empty().removeClass('fade-in');
    $c.append($('<p class="sub-text"></p>').text(sub.text));
    const isArtistCarousel = sub.items.length > 1;
    const musicFlipSubs = ['artistas', 'pop', 'romantica', 'playlists'];
    const isMusicFlip = catKey === 'musica' && musicFlipSubs.indexOf(sub.id) !== -1;
    $('#catDetail').toggleClass('artist-mode', isArtistCarousel);
    const $list = $('<div class="items"></div>').toggleClass('artist-carousel', isArtistCarousel);
    sub.items.forEach(function (it, index) {
      // .ph reserva su tamaño con aspect-ratio; dimensiones y decode async evitan saltos al cargar desde Dropbox.
      const $image = $('<img loading="lazy" decoding="async" width="800" height="600">').attr({ src: it.img, alt: it.n });
      $image.on('load', function () { $(this).closest('.ph').removeClass('noimg'); });
      $image.on('error', function () {
        const image = this;
        let imageUrl;
        try { imageUrl = new URL(image.src); } catch (error) { imageUrl = null; }
        if (imageUrl && imageUrl.hostname === 'www.dropbox.com' && !image.dataset.dropboxFallback) {
          image.dataset.dropboxFallback = 'used';
          imageUrl.hostname = 'dl.dropboxusercontent.com';
          image.src = imageUrl.href;
          return;
        }
        $(image).closest('.ph').addClass('noimg');
      });
      const $ph = $('<div class="ph"></div>')
        .append($image)
        .append('<i class="bi bi-image ph-icon" aria-hidden="true"></i>');
      if (isMusicFlip) {
        const $front = $('<div class="artist-face artist-front"></div>');
        $front.append($ph).append($('<div class="item-body"></div>')
          .append($('<h4></h4>').text(it.n))
          .append($('<p></p>').text(it.d)));
        const $back = $('<div class="artist-face artist-back" inert></div>')
          .append('<i class="bi bi-music-note-list artist-back-icon" aria-hidden="true"></i>')
          .append($('<h4></h4>').text(it.n))
          .append($('<p class="artist-song-hint"></p>').text('Canciones para escuchar en Spotify'));
        const $tracks = $('<div class="artist-track-list"></div>');
        (it.songs || []).forEach(function (song) {
          const title = typeof song === 'string' ? song : song.title;
          const songArtist = typeof song === 'string' ? (it.spotifyArtist || it.n) : (song.artist || it.spotifyArtist || it.n);
          const query = songArtist + ' ' + title;
          const $link = $('<a class="artist-spotify-track" target="_blank" rel="noopener noreferrer"></a>')
            .attr('href', 'https://open.spotify.com/search/' + encodeURIComponent(query))
            .append('<i class="bi bi-play-circle-fill" aria-hidden="true"></i>')
            .append($('<span></span>').text(title + ' · ' + songArtist))
            .append('<i class="bi bi-spotify spotify-mark" aria-hidden="true"></i>');
          $tracks.append($link);
        });        if (!it.songs || !it.songs.length) {
          const query = it.spotifyArtist || it.n;
          const $fallback = $('<a class="artist-spotify-track" target="_blank" rel="noopener noreferrer"></a>')
            .attr('href', 'https://open.spotify.com/search/' + encodeURIComponent(query));
          $fallback.append('<i class="bi bi-spotify spotify-mark" aria-hidden="true"></i>')
            .append($('<span></span>').text('Buscar canciones de ' + it.n));
          $tracks.append($fallback);
        }
        $back.append($tracks);
        const $inner = $('<div class="artist-flip-inner"></div>').append($front, $back);
        const $toggle = $('<button type="button" class="artist-flip-toggle" aria-expanded="false"><i class="bi bi-arrow-repeat" aria-hidden="true"></i><span>Canciones</span></button>')
          .attr('aria-label', 'Ver canciones de ' + it.n);
        $('<article class="card item artist-card"></article>')
          .prop('hidden', index !== 0).attr('aria-hidden', String(index !== 0))
          .append($inner, $toggle).appendTo($list);
      } else {
        $('<article class="card item"></article>')
          .prop('hidden', isArtistCarousel && index !== 0)
          .append($ph)
          .append($('<div class="item-body"></div>')
            .append($('<h4></h4>').text(it.n))
            .append($('<p></p>').text(it.d)))
          .appendTo($list);
      }
    });
    $c.append($list);
    if (isArtistCarousel) {
      const $controls = $('<div class="artist-controls" aria-label="Navegar por elementos"></div>');
      $('<button type="button" class="artist-nav" data-artist-step="-1"><i class="bi bi-arrow-left" aria-hidden="true"></i><span>Anterior</span></button>').appendTo($controls);
      $('<span class="artist-count" aria-live="polite"></span>').text('1 de ' + sub.items.length).appendTo($controls);
      $('<button type="button" class="artist-nav" data-artist-step="1"><span>Siguiente</span><i class="bi bi-arrow-right" aria-hidden="true"></i></button>').appendTo($controls);
      $c.append($controls);
      updateArtistControls();
    }
    void $c[0].offsetWidth;
    $c.addClass('fade-in');
    checkImages($c);
  }

  function updateArtistControls() {
    const total = $('#subContent .artist-carousel .item').length;
    if (!total) return;
    $('#subContent .artist-carousel .item').each(function (index) {
      const active = index === artistIndex;
      $(this).prop('hidden', !active).attr('aria-hidden', String(!active));
    });
    $('#subContent .artist-count').text((artistIndex + 1) + ' de ' + total);
    $('#subContent [data-artist-step="-1"]').prop('disabled', artistIndex === 0);
    $('#subContent [data-artist-step="1"]').prop('disabled', artistIndex === total - 1);
  }
  function selectCategory(catKey) {
    curCat = catKey;
    renderSubs(catKey);
    renderContent(catKey, DATA[catKey].subs[0].id);
  }

  function showDetail(catKey) {
    $('#catGrid, #catGrid .cat-card').removeAttr('style');
    $('#intereses').addClass('category-open'); $('#catGrid').removeClass('is-returned is-mobile-detail').addClass('is-detail').prop('hidden', true);
    $('#catDetail').prop('hidden', false).removeClass('fade-in');
    void $('#catDetail')[0].offsetWidth;
    $('#catDetail').addClass('fade-in');
    selectCategory(catKey);
    $('#backBtn').trigger('focus');
  }

  function showGrid() {
    const last = curCat;
    $('#catDetail').prop('hidden', true);
    $('#intereses').removeClass('category-open'); $('#catGrid').removeClass('is-detail is-returned is-mobile-detail').removeAttr('style').prop('hidden', false);
    const $cards = $('#catGrid .cat-card').removeAttr('style');
    curCat = curSub = null;
    $cards.each(function () {
      this.classList.add('in');
      if ($(this).data('cat') === last) $(this).trigger('focus');
    });
  }

  $(function () {
    renderTabs();
    $('#catGrid').off('click.asCategories', '.cat-card').on('click.asCategories', '.cat-card', function () { showDetail($(this).data('cat')); });
    $('#catTabs').off('click.asCategories', '.tab').on('click.asCategories', '.tab', function () { selectCategory($(this).data('cat')); });
    $('#subChips').off('click.asCategories', '.subchip').on('click.asCategories', '.subchip', function () {
      const subId = $(this).data('sub');
      const category = curCat;
      const $content = $('#subContent');
      $content.stop(true, true).slideUp(180, function () {
        if (curCat !== category) {
          $content.stop(true, true).show();
          return;
        }
        renderContent(category, subId);
        $content.hide().slideDown(260);
      });
    });
    $('#subContent').off('click.asCategories', '.artist-flip-toggle').on('click.asCategories', '.artist-flip-toggle', function () {
      const $card = $(this).closest('.artist-card');
      const flipped = !$card.hasClass('is-flipped');
      $card.toggleClass('is-flipped', flipped);
      $card.find('.artist-front').prop('inert', flipped);
      $card.find('.artist-back').prop('inert', !flipped);
      $(this).attr('aria-expanded', String(flipped))
        .attr('aria-label', (flipped ? 'Volver a la foto de ' : 'Ver canciones de ') + $card.find('.artist-front h4').text());
      $(this).find('span').text(flipped ? 'Volver' : 'Canciones');
    });
    $('#subContent').off('click.asArtistControls', '[data-artist-step]').on('click.asArtistControls', '[data-artist-step]', function () {
      artistIndex += Number($(this).data('artist-step'));
      updateArtistControls();
    });
    $('#backBtn').off('click.asCategories').on('click.asCategories', showGrid);
  });
})(jQuery);







