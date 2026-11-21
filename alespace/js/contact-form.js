/* Validación local y confirmación expirable para mensajes de Contacto
   EJECUCIÓN: hilo principal del navegador; js/app.js lo importa después de jQuery.
   INICIO: al ejecutarse enlaza el formulario; input/change/blur validan y submit abre el modal. */
(function ($) {
  'use strict';
  const form = document.getElementById('contactForm');
  if (!form) return;

  const status = document.getElementById('formStatus');
  const modal = document.getElementById('contactConfirmModal');
  const $modal = $('#contactConfirmModal');
  const countdown = document.getElementById('confirmCountdown');
  const confirmButton = document.getElementById('acceptContactConfirm');
  const submitButton = form.querySelector('[type="submit"]');
  const toast = document.getElementById('contactToast');
  const toastMessage = document.getElementById('contactToastMessage');
  const fields = [
    { input: 'contactName', error: 'nameError', missing: 'Escribe tu nombre.', short: 'El nombre debe tener al menos 2 caracteres.', invalid: 'El nombre no puede contener números.', validate: function (value) { return !/\d/.test(value); } },
    { input: 'contactEmail', error: 'emailError', missing: 'Escribe un correo electrónico válido.', invalid: 'Revisa el formato del correo electrónico.' },
    { input: 'contactPhone', error: 'phoneError', optional: true, invalid: 'El teléfono debe tener exactamente 8 dígitos, sin letras.', requiredWhen: function () { return document.getElementById('contactPreference').value === 'WhatsApp'; }, conditionalMissing: 'Agrega tu teléfono para que pueda responderte por WhatsApp.', validate: function (value) { return /^\d{8}$/.test(value); } },
    { input: 'contactReason', error: 'reasonError', missing: 'Selecciona el motivo de tu contacto.' },
    { input: 'contactPreference', error: 'preferenceError', missing: 'Selecciona cómo prefieres recibir respuesta.' },
    { input: 'contactSubject', error: 'subjectError', missing: 'Escribe el asunto.', short: 'El asunto debe tener al menos 3 caracteres.' },
    { input: 'contactMessage', error: 'messageError', missing: 'Escribe tu mensaje.', short: 'El mensaje debe tener al menos 10 caracteres.' }
  ];
  let timerId = null;
  let remaining = 30;
  let pendingMessage = null;
  let toastTimer = null;

  function showToast(message, isError) {
    if (!toast || !toastMessage) return;
    if (toastTimer !== null) window.clearTimeout(toastTimer);
    toastMessage.textContent = message;
    toast.classList.toggle('is-error', Boolean(isError));
    toast.setAttribute('aria-live', isError ? 'assertive' : 'polite');
    $(toast).stop(true, true).hide().slideDown(250);
    toastTimer = window.setTimeout(function () {
      $(toast).stop(true, true).fadeOut(350);
      toastTimer = null;
    }, 3000);
  }

  function validateField(config) {
    const input = document.getElementById(config.input);
    const error = document.getElementById(config.error);
    const value = input.value.trim();
    let message = '';
    if (!value && config.requiredWhen && config.requiredWhen()) message = config.conditionalMissing;
    else if (!value && !config.optional) message = config.missing;
    else if (value && config.validate && !config.validate(value)) message = config.invalid;
    else if (value && input.type === 'email' && input.validity.typeMismatch) message = config.invalid;
    else if (value && input.validity.tooShort) message = config.short;
    input.setAttribute('aria-invalid', String(Boolean(message)));
    error.textContent = message;
    return !message;
  }

  function clearCountdown() {
    if (timerId !== null) window.clearInterval(timerId);
    timerId = null;
  }

  function renderCountdown() {
    countdown.textContent = '00:' + String(remaining).padStart(2, '0');
  }

  function hideConfirmation() {
    clearCountdown();
    $modal.stop(true, true).fadeOut(220, function () {
      modal.setAttribute('hidden', '');
      $(this).css('display', '');
      if (submitButton) submitButton.focus();
    });
  }

  function expireConfirmation() {
    if (!pendingMessage) return;
    pendingMessage = null;
    clearCountdown();
    status.textContent = 'Tarifa Flash Expirada';
    status.classList.remove('is-valid', 'is-pending');
    status.classList.add('is-expired');
    hideConfirmation();
  }

  function openConfirmation(message) {
    pendingMessage = message;
    remaining = 30;
    renderCountdown();
    status.textContent = '';
    status.classList.remove('is-valid', 'is-expired', 'is-pending');
    modal.removeAttribute('hidden');
    $modal.stop(true, true).css('display', 'flex').hide().fadeIn(220, function () {
      confirmButton.focus();
    });
    timerId = window.setInterval(function () {
      remaining -= 1;
      renderCountdown();
      if (remaining <= 0) expireConfirmation();
    }, 1000);
  }

  function saveMessage(message) {
    try {
      const messages = JSON.parse(localStorage.getItem('as-contact-messages') || '[]');
      const savedMessage = Object.assign({
        id: 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        createdAt: new Date().toISOString(),
        syncStatus: 'pending'
      }, message);
      messages.unshift(savedMessage);
      localStorage.setItem('as-contact-messages', JSON.stringify(messages.slice(0, 100)));
      form.reset();
      fields.forEach(function (config) {
        document.getElementById(config.input).setAttribute('aria-invalid', 'false');
        document.getElementById(config.error).textContent = '';
      });
      status.textContent = navigator.onLine
        ? 'Guardado localmente; sincronización pendiente.'
        : 'Guardado en este dispositivo; pendiente hasta recuperar conexión.';
      status.classList.remove('is-valid', 'is-expired', 'is-pending');
      status.classList.add('is-pending');
      showToast(navigator.onLine
        ? 'Mensaje guardado. Sincronización pendiente.'
        : 'Mensaje guardado en este dispositivo; se enviará al volver la conexión.');
      document.dispatchEvent(new CustomEvent('as:messages-changed'));
      document.dispatchEvent(new CustomEvent('as:outbox-message', { detail: savedMessage }));
    } catch (error) {
      status.textContent = 'No se pudo guardar el mensaje en este navegador.';
      status.classList.remove('is-valid', 'is-expired', 'is-pending');
      showToast('No se pudo guardar el mensaje en este navegador.', true);
    }
  }

  const nameInput = document.getElementById('contactName');
  $(nameInput).off('beforeinput.asContactName').on('beforeinput.asContactName', function (event) {
    const typed = event.originalEvent ? event.originalEvent.data : event.data;
    if (typed && /^\d+$/.test(typed)) event.preventDefault();
  });

  fields.forEach(function (config) {
    const input = document.getElementById(config.input);
    function onFieldChange() {
      if (config.input === 'contactName') input.value = input.value.replace(/\d/g, '');
      if (config.input === 'contactPhone') input.value = input.value.replace(/\D/g, '').slice(0, 8);
      status.textContent = '';
      status.classList.remove('is-valid', 'is-expired', 'is-pending');
      validateField(config);
      if (config.input === 'contactPreference') validateField(fields[2]);
      if (config.input === 'contactPhone') validateField(fields[4]);
    }
    $(input).off('.asContact');
    $(input).on('input.asContact change.asContact', onFieldChange);
    $(input).on('blur.asContact', function () {
      if (input.value || input.getAttribute('aria-invalid') === 'true' || (!config.optional && input.tagName === 'SELECT')) validateField(config);
    });
  });

  $(form).off('submit.asContact').on('submit.asContact', function (event) {
    event.preventDefault();
    const results = fields.map(validateField);
    if (!results.every(Boolean)) {
      status.textContent = 'Revisa los campos marcados para continuar.';
      status.classList.remove('is-valid', 'is-expired', 'is-pending');
      document.dispatchEvent(new CustomEvent('as:form-invalid'));
      const firstInvalid = fields.find(function (config) {
        return document.getElementById(config.input).getAttribute('aria-invalid') === 'true';
      });
      if (firstInvalid) document.getElementById(firstInvalid.input).focus();
      return;
    }
    if (pendingMessage) return;
    openConfirmation({
      name: document.getElementById('contactName').value.trim(),
      email: document.getElementById('contactEmail').value.trim(),
      countryCode: document.getElementById('contactCountryCode').value,
      phone: document.getElementById('contactPhone').value.trim(),
      reason: document.getElementById('contactReason').value,
      contactPreference: document.getElementById('contactPreference').value,
      subject: document.getElementById('contactSubject').value.trim(),
      message: document.getElementById('contactMessage').value.trim()
    });
  });

  $(confirmButton).off('click.asContact').on('click.asContact', function () {
    if (!pendingMessage) return;
    if (remaining <= 0) {
      expireConfirmation();
      return;
    }
    const message = pendingMessage;
    pendingMessage = null;
    clearCountdown();
    hideConfirmation();
    saveMessage(message);
  });

  $('#cancelContactConfirm').off('click.asContact').on('click.asContact', function () {
    pendingMessage = null;
    status.textContent = '';
    status.classList.remove('is-expired', 'is-pending');
    hideConfirmation();
  });
  $(modal).off('click.asContact').on('click.asContact', function (event) {
    if (event.target === modal) {
      pendingMessage = null;
      hideConfirmation();
    }
  });
  $(document).off('keydown.asContact').on('keydown.asContact', function (event) {
    if (event.key === 'Escape' && !modal.hasAttribute('hidden')) {
      pendingMessage = null;
      hideConfirmation();
    }
  });
})(jQuery);
