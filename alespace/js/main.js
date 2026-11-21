/* ALEJANDRA SPACE · main.js
   EJECUCIÓN: hilo principal del navegador; index.html llega a este módulo mediante js/app.js.
   INICIO: registra tema, galería, redes y animaciones cuando jQuery detecta DOM listo. */
document.documentElement.classList.add('js');

// Exportación ES Module: categories.js importa esta función; el bundler puede descartar exports no usados.
export function checkImages(root) {
  const $ = window.jQuery;
  $(root || document).find('.ph img').each(function () {
    if (this.complete && this.naturalWidth === 0) $(this).closest('.ph').addClass('noimg');
  });
}

(function ($) {
  'use strict';

  /* ---------- ENLACES DE REDES (reemplaza TU_USUARIO por tus datos reales) ---------- */
  const SOCIAL = [
    { name: 'Instagram', icon: 'bi-instagram', url: 'https://instagram.com/TU_USUARIO' },
    { name: 'Facebook',  icon: 'bi-facebook',  url: 'https://facebook.com/TU_USUARIO' },
    { name: 'TikTok',    icon: 'bi-tiktok',    url: 'https://tiktok.com/@TU_USUARIO' },
    { name: 'YouTube',   icon: 'bi-youtube',   url: 'https://youtube.com/@TU_USUARIO' },
    { name: 'LinkedIn',  icon: 'bi-linkedin',  url: 'https://linkedin.com/in/TU_USUARIO' },
    { name: 'Correo',    icon: 'bi-envelope-fill', url: 'mailto:TU_CORREO@ejemplo.com' }
  ];

  /* ---------- FOTOS DE LA GALERÍA (enlaces compartidos de Dropbox) ---------- */
  const GALLERY = [
    { src: 'https://www.dropbox.com/scl/fi/bzg0lpeal252g8sbm3236/foto-12.jpeg?rlkey=utykyyxdd50mhg42f14j9zcpv&st=jdmatlwm&raw=1', caption: 'Foto 1' },
    { src: 'https://www.dropbox.com/scl/fi/56iz2nk1ad0pox7c600xo/foto-11.jpeg?rlkey=dc1i706igwvspu07vlb47c5mq&st=ivsatgbd&raw=1', caption: 'Foto 2' },
    { src: 'https://www.dropbox.com/scl/fi/kq8i2fy6zcrktdxwz4g9q/foto-4.jpeg?rlkey=ro0bhxzmbgkjsqd1ybiify9l2&st=q5qln71q&raw=1', caption: 'Foto 3' },
    { src: 'https://www.dropbox.com/scl/fi/bx11w1l9rjc0zc1a6yzoy/foto-2.jpeg?rlkey=j21649zawt723hjp42eiirmgf&st=r0tunq3r&raw=1', caption: 'Foto 4' },
    { src: 'https://www.dropbox.com/scl/fi/yk3plzx1rm6o17jdm49vi/foto-5.jpeg?rlkey=acai3uzi3hdyzooyld10w47sr&st=0kz4nt0z&raw=1', caption: 'Foto 5' },
    { src: 'https://www.dropbox.com/scl/fi/zg6u5ex8mnnjaipcrl4a0/foto-7.jpeg?rlkey=109gjhxm0mkbpo1f2ya415yl5&st=tic21f1p&raw=1', caption: 'Foto 6' },
    { src: 'https://www.dropbox.com/scl/fi/vzl7qazi1y83tcmlkvdpm/foto-1.jpeg?rlkey=sjt8f5c1xus69q6wugh88oami&st=c7ln8a8k&raw=1', caption: 'Foto 7' },
    { src: 'https://www.dropbox.com/scl/fi/3y7m69penqjwv85lud4qn/alejandra.png?rlkey=253f3itj0yo514lpyc0nnat5j&st=vm0b3u1h&raw=1', caption: 'Alejandra' }
  ];
  /* ---------- Imágenes que faltan: mostrar el marcador ---------- */
  document.addEventListener('error', function (e) {
    if (e.target.tagName === 'IMG') $(e.target).closest('.ph').addClass('noimg');
  }, true);
  /* ---------- Tema claro / oscuro ---------- */
  function applyTheme(theme) {
    $('html').attr('data-theme', theme);
    $('#themeToggle')
      .attr('aria-checked', String(theme === 'dark'))
      .attr('aria-label', theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    $('meta[name="theme-color"]').attr('content', theme === 'dark' ? '#090909' : '#FFFFFF');
  }
  function initTheme() {
    let saved = 'dark';
    try { saved = localStorage.getItem('as-theme') || 'dark'; } catch (e) {}
    applyTheme(saved);
    $('#themeToggle').off('click.asTheme').on('click.asTheme', function () {
      const next = $('html').attr('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem('as-theme', next); } catch (e) {}
    });
  }

  /* ---------- Galería y modal ---------- */
  let lastFocus = null;
  function openLightbox(item) {
    lastFocus = document.activeElement;
    $('#lbImg').attr({ src: item.src, alt: item.caption });
    $('#lbCap').text(item.caption);
    $('#lightbox .ph').removeClass('noimg');
    $('#lightbox').prop('hidden', false);
    $('#lbClose').trigger('focus');
  }
  function closeLightbox() {
    $('#lightbox').prop('hidden', true);
    if (lastFocus) lastFocus.focus();
  }
  function buildGallery() {
    const $g = $('#gallery').empty();
    GALLERY.forEach(function (item, i) {
      const $btn = $('<button type="button" class="g-item reveal"></button>')
        .attr({ 'aria-label': 'Ampliar ' + item.caption, 'data-gallery-index': i });
      const $ph = $('<span class="ph"></span>')
        // El contenedor .g-item ya reserva una proporción cuadrada; estas dimensiones también estabilizan el tamaño intrínseco.
        .append($('<img loading="lazy" decoding="async" width="800" height="800" alt="">').attr('src', item.src))
        .append('<i class="bi bi-image ph-icon" aria-hidden="true"></i>');
      $btn.append($ph);
      $g.append($btn);
    });
    $g.off('click.asGallery', '.g-item').on('click.asGallery', '.g-item', function () {
      const item = GALLERY[Number($(this).attr('data-gallery-index'))];
      if (item) openLightbox(item);
    });
    $('#lbClose').off('click.asGallery').on('click.asGallery', closeLightbox);
    $('#lightbox').off('click.asGallery').on('click.asGallery', function (e) { if (e.target === this) closeLightbox(); });
    $(document).off('keydown.asGallery').on('keydown.asGallery', function (e) {
      if (e.key === 'Escape' && !$('#lightbox').prop('hidden')) closeLightbox();
    });
  }

  /* ---------- Redes sociales ---------- */
  function buildSocial() {
    const $s = $('#social');
    SOCIAL.forEach(function (item) {
      const $a = $('<a class="social-btn reveal"></a>')
        .attr({ href: item.url, target: '_blank', rel: 'noopener noreferrer', 'aria-label': item.name });
      $a.append($('<i aria-hidden="true"></i>').addClass('bi ' + item.icon)).append($('<span></span>').text(item.name));
      $s.append($a);
    });
  }

  /* ---------- Animación de entrada ---------- */
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('in'); }); return; }
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  }

  $(function () {
    initTheme();
    buildGallery();
    buildSocial();
    initReveal();
    checkImages();
    $('#year').text(new Date().getFullYear());
  });
  $(window).off('load.asImages').on('load.asImages', function () { checkImages(); });
})(jQuery);


