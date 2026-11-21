/* Tema claro/oscuro con persistencia en LocalStorage */
(function () {
  var KEY = 'kt-theme', root = document.documentElement, switchTimer = null;
  function saved() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function apply(t) {
    root.setAttribute('data-theme', t);
    var b = document.getElementById('themeToggle');
    if (b) { b.setAttribute('aria-checked', String(t === 'dark')); b.setAttribute('aria-label', t === 'dark' ? 'Modo oscuro activado' : 'Modo claro activado'); }
    var m = document.querySelector('meta[name=theme-color]');
    if (m) m.setAttribute('content', t === 'dark' ? '#090909' : '#FBF7EE');
  }
  apply(saved() === 'light' ? 'light' : 'dark'); // se aplica antes de pintar para evitar parpadeos
  window.KTTheme = {
    toggle: function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.classList.add('theme-switching');
      apply(next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
      // LIMPIEZA: reemplaza el timeout de la transición para no dejar temporizadores acumulados.
      clearTimeout(switchTimer);
      switchTimer = setTimeout(function () { root.classList.remove('theme-switching'); }, 500);
    }
  };
  document.addEventListener('DOMContentLoaded', function () {
    apply(root.getAttribute('data-theme'));
    var b = document.getElementById('themeToggle');
    if (b) {
      b.removeEventListener('click', window.KTTheme.toggle);
      b.addEventListener('click', window.KTTheme.toggle);
    }
  });
})();
