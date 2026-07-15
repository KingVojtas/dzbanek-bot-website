/**
 * Shared chrome: year, mobile nav, toast, clipboard, active path highlighting.
 */
(function () {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const menuBtn = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  menuBtn?.addEventListener('click', () => {
    const open = mobileMenu?.classList.toggle('hidden') === false;
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  mobileMenu?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
      menuBtn?.setAttribute('aria-expanded', 'false');
    });
  });

  // Highlight current page in nav
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('[data-nav-page]').forEach((el) => {
    const page = (el.getAttribute('data-nav-page') || '').toLowerCase();
    if (page === path || (path === '' && page === 'index.html')) {
      el.classList.add('text-white');
      el.classList.remove('text-discord-muted');
    }
  });

  // Toast
  let toastTimer;
  window.showToast = function showToast(message) {
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.className =
        'fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-full bg-discord-blurple px-4 py-2 text-sm font-medium text-white shadow-glow opacity-0 pointer-events-none transition';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.remove('opacity-0');
    el.classList.add('opacity-100');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.add('opacity-0');
      el.classList.remove('opacity-100');
    }, 1800);
  };

  window.copyText = async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      window.showToast('Copied: ' + text);
    } catch {
      window.showToast('Could not copy');
    }
  };
})();
