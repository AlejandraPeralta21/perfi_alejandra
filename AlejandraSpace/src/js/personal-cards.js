/* Tarjetas volteables y paginadas de Mi espacio
   EJECUCIÓN: hilo principal del navegador; src/js/app.js lo importa como módulo tras el parseo del HTML.
   INICIO: prepara las tarjetas al cargar y delega clicks desde #personalGrid/.personal-pages. */
(function () {
  'use strict';
  const cards = Array.from(document.querySelectorAll('[data-flip-card]'));

  function resetCard(card) {
    const button = card.querySelector('.flip-toggle');
    const front = card.querySelector('.card-front');
    const back = card.querySelector('.card-back');
    card.classList.remove('is-flipped');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Voltear tarjeta: ' + button.dataset.cardTitle);
    front.setAttribute('aria-hidden', 'false');
    back.setAttribute('aria-hidden', 'true');
    front.inert = false;
    back.inert = true;
  }

  cards.forEach(function (card) {
    const button = card.querySelector('.flip-toggle');
    const front = card.querySelector('.card-front');
    const back = card.querySelector('.card-back');
    if (!button || !front || !back) return;
    button.dataset.cardTitle = button.getAttribute('aria-label').replace(/^Voltear tarjeta: /, '');
    resetCard(card);
  });

  const grid = document.getElementById('personalGrid');
  if (!grid) return;

  // Un solo listener delegado controla botones presentes y futuros de las tarjetas.
  $(grid).off('click.asPersonalCards', '.flip-toggle').on('click.asPersonalCards', '.flip-toggle', function () {
    const button = this;
    const card = button.closest('[data-flip-card]');
    if (!card) return;
    const front = card.querySelector('.card-front');
    const back = card.querySelector('.card-back');
    if (!front || !back) return;
    const cardTitle = button.dataset.cardTitle || button.getAttribute('aria-label').replace(/^(Voltear tarjeta: |Volver al frente: )/, '');
    button.dataset.cardTitle = cardTitle;
    const flipped = !card.classList.contains('is-flipped');
    card.classList.toggle('is-flipped', flipped);
    button.setAttribute('aria-expanded', String(flipped));
    button.setAttribute('aria-label', (flipped ? 'Volver al frente: ' : 'Voltear tarjeta: ') + cardTitle);
    front.setAttribute('aria-hidden', String(flipped));
    back.setAttribute('aria-hidden', String(!flipped));
    front.inert = flipped;
    back.inert = !flipped;
  });

  const pageLabel = document.getElementById('personalPageLabel');
  const $pages = $('.personal-pages');
  const totalPages = Math.max.apply(null, cards.map(function (card) { return Number(card.dataset.cardPage || 1); }));
  let currentPage = 1;

  function showPage(page) {
    currentPage = Math.max(1, Math.min(totalPages, page));
    cards.forEach(function (card) {
      const active = Number(card.dataset.cardPage || 1) === currentPage;
      resetCard(card);
      card.hidden = !active;
      card.inert = !active;
      card.setAttribute('aria-hidden', String(!active));
      if (active) card.classList.add('in');
    });
    pageLabel.textContent = 'Página ' + currentPage + ' de ' + totalPages;
    $('[data-page-step="-1"]').prop('disabled', currentPage === 1);
    $('[data-page-step="1"]').prop('disabled', currentPage === totalPages);
  }

  $pages.off('click.asPersonalPages', '.page-nav').on('click.asPersonalPages', '.page-nav', function () {
    if (!this.disabled) showPage(currentPage + Number(this.dataset.pageStep));
  });
  showPage(1);
})();
