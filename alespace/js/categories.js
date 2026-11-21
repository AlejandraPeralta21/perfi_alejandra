/* ALEJANDRA SPACE · categories.js
   EJECUCIÓN: hilo principal del navegador; js/app.js lo importa después de jQuery y main.js.
   INICIO: DOM listo; carga categories.json con fetch y conserva fallback offline del build.
   Categorías → subcategorías → contenido, sin recargar la página.
   Todo el texto se inserta con .text(); la fuente de categorías es js/categories.json. */
import { checkImages } from './main.js';

(function ($) {
  'use strict';

  let DATA = null;
  const ORDER = ['musica', 'videojuegos', 'deportes'];

  function readInlineFallback() {
    const node = document.getElementById('categoryDataFallback');
    if (!node) return null;
    try { return JSON.parse(node.textContent); } catch (error) { return null; }
  }

  async function loadCategoryData() {
    const fallback = readInlineFallback();
    if (window.location.protocol === 'file:' && fallback) {
      DATA = fallback;
      return DATA;
    }
    try {
      const response = await fetch(new URL('./js/categories.json', document.baseURI));
      if (!response.ok) throw new Error('No se pudo leer categories.json');
      const candidate = await response.json();
      const valid = ORDER.every(function (key) {
        return candidate[key] && Array.isArray(candidate[key].subs) && candidate[key].subs.every(function (sub) {
          return Array.isArray(sub.items);
        });
      });
      if (!valid) throw new Error('El archivo de categorías tiene una estructura inválida');
      DATA = candidate;
      return DATA;
    } catch (error) {
      if (fallback) {
        DATA = fallback;
        return DATA;
      }
      throw error;
    }
  }
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

  $(async function () {
    $('#catGrid').attr('aria-busy', 'true');
    try {
      await loadCategoryData();
    } catch (error) {
      $('#catGrid').attr('aria-busy', 'false');
      $('#subContent').text('No se pudieron cargar las categorías. Revisa tu conexión e inténtalo de nuevo.');
      return;
    }
    $('#catGrid').attr('aria-busy', 'false');
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







