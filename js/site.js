/**
 * Shared chrome: year, mobile nav, toast, clipboard, active path,
 * skip-link, back-to-top, external-link safety.
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
      el.classList.add('text-white', 'is-current-page');
      el.classList.remove('text-discord-muted');
      el.setAttribute('aria-current', 'page');
    }
  });

  // External links: open safely
  document.querySelectorAll('a[href^="http"]').forEach((a) => {
    try {
      const u = new URL(a.href);
      if (u.origin !== location.origin) {
        if (!a.target) a.target = '_blank';
        const rel = (a.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
        if (!rel.includes('noopener')) rel.push('noopener');
        if (!rel.includes('noreferrer')) rel.push('noreferrer');
        a.setAttribute('rel', rel.join(' '));
      }
    } catch (e) {
      /* ignore */
    }
  });

  // Toast (above mobile sticky CTA when present)
  let toastTimer;
  window.showToast = function showToast(message) {
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.className = 'site-toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove('is-on');
    }, 1800);
  };

  window.copyText = async function copyText(text) {
    var tFn = window.t || (window.DZBANEK_I18N && window.DZBANEK_I18N.t);
    try {
      await navigator.clipboard.writeText(text);
      var ok = tFn ? tFn('toast.copied', { text: text }) : 'Copied: ' + text;
      window.showToast(ok);
    } catch {
      var fail = tFn ? tFn('toast.copy_fail') : 'Could not copy';
      window.showToast(fail);
    }
  };

  // Back to top
  (function backToTop() {
    let btn = document.getElementById('back-to-top');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'back-to-top';
      btn.type = 'button';
      btn.className = 'back-to-top';
      btn.setAttribute('aria-label', 'Back to top');
      btn.innerHTML =
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
      document.body.appendChild(btn);
    }
    function update() {
      const show = window.scrollY > 480;
      btn.classList.toggle('is-on', show);
      btn.hidden = !show;
    }
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    window.addEventListener('scroll', update, { passive: true });
    update();
  })();

  // Skip link: ensure main is focusable
  const main = document.querySelector('main');
  if (main && !main.id) main.id = 'main';
  if (main && !main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
})();
