/**
 * Year, mobile nav, current page, nav pill, copy-to-clipboard.
 */
(function () {
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---- mobile menu ---- */

  const menuBtn = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  function setMenu(open, { focusButton = false } = {}) {
    if (!mobileMenu || !menuBtn) return;
    mobileMenu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    if (open) mobileMenu.querySelector('a')?.focus({ preventScroll: true });
    else if (focusButton) menuBtn.focus();
  }

  menuBtn?.addEventListener('click', () => setMenu(mobileMenu?.hidden !== false));
  mobileMenu?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && mobileMenu && !mobileMenu.hidden) setMenu(false, { focusButton: true });
  });
  document.addEventListener('pointerdown', (event) => {
    if (!mobileMenu || mobileMenu.hidden) return;
    if (mobileMenu.contains(event.target) || menuBtn?.contains(event.target)) return;
    setMenu(false);
  });
  window.matchMedia('(min-width: 981px)').addEventListener('change', (event) => {
    if (event.matches) setMenu(false);
  });

  /* ---- current page + sliding pill ---- */

  // Pages also answer without .html (/commands), so compare bare names.
  const bare = (name) => name.toLowerCase().replace(/\.html$/, '') || 'index';
  const path = bare(location.pathname.split('/').pop());
  document.querySelectorAll('[data-nav-page]').forEach((el) => {
    if (bare(el.getAttribute('data-nav-page') || '') === path) {
      el.setAttribute('aria-current', 'page');
    }
  });

  const deskNav = document.querySelector('.desk-nav');
  const pill = deskNav?.querySelector('.nav-pill');

  function movePill(link) {
    if (!pill) return;
    if (!link) {
      pill.classList.remove('is-ready');
      return;
    }
    pill.style.left = link.offsetLeft + 'px';
    pill.style.width = link.offsetWidth + 'px';
    pill.classList.add('is-ready');
  }

  function homePill() {
    movePill(deskNav?.querySelector('a[aria-current="page"]'));
  }

  if (deskNav && pill) {
    deskNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('pointerenter', () => movePill(link));
      link.addEventListener('focus', () => movePill(link));
    });
    deskNav.addEventListener('pointerleave', homePill);
    deskNav.addEventListener('focusout', (event) => {
      if (!deskNav.contains(event.relatedTarget)) homePill();
    });
    window.addEventListener('resize', homePill);
    window.addEventListener('dzbanek:lang', () => requestAnimationFrame(homePill));
    document.fonts?.ready.then(homePill);
    homePill();
  }

  /* ---- header on scroll ---- */

  const header = document.querySelector('.site-header');
  // A 12px strip at the top of the page: once it leaves the screen, the page has scrolled.
  // An observer instead of a scroll listener, so scrolling runs no script at all.
  if (header && 'IntersectionObserver' in window) {
    const top = document.createElement('div');
    top.setAttribute('aria-hidden', 'true');
    top.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:12px;pointer-events:none;';
    document.body.prepend(top);
    new IntersectionObserver(([entry]) => {
      header.classList.toggle('is-scrolled', !entry.isIntersecting);
    }).observe(top);
  } else if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- toast + copy ---- */

  let toastTimer;
  function showToast(message) {
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.className = 'toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-on'), 1800);
  }
  window.showToast = showToast;

  document.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const text = button.getAttribute('data-copy') || '';
      const t = window.t;
      try {
        await navigator.clipboard.writeText(text);
        showToast(t ? t('toast.copied').replace('{{text}}', text) : 'Copied: ' + text);
      } catch (e) {
        showToast(t ? t('toast.fail') : 'Could not copy');
      }
    });
  });

  /* ---- commands: filter ---- */

  const filter = document.querySelector('[data-cmd-filter]');
  if (filter) {
    const cards = Array.from(document.querySelectorAll('[data-cmd]'));
    const empty = document.querySelector('[data-cmd-empty]');
    filter.addEventListener('input', () => {
      const query = filter.value.trim().toLowerCase().replace(/^\//, '');
      let shown = 0;
      cards.forEach((card) => {
        const match = !query || card.textContent.toLowerCase().includes(query);
        card.hidden = !match;
        if (match) shown += 1;
      });
      if (empty) empty.hidden = shown > 0;
    });
  }
})();
