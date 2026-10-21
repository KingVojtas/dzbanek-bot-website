/**
 * Year, mobile nav, current page, nav pill, hero light, invite links, copy-to-clipboard.
 */
(function () {
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  const invite = window.DZBANEK && window.DZBANEK.INVITE_URL;
  if (invite) {
    document.querySelectorAll('[data-invite]').forEach((link) => {
      link.setAttribute('href', invite);
    });
  }

  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)');

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

  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('[data-nav-page]').forEach((el) => {
    if ((el.getAttribute('data-nav-page') || '').toLowerCase() === path) {
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
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- hero: a warm light follows the pointer ---- */

  const stage = document.querySelector('.hero-stage');
  if (stage && fine.matches && !calm.matches) {
    let frame = 0;
    stage.addEventListener('pointermove', (event) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const box = stage.getBoundingClientRect();
        stage.style.setProperty('--mx', Math.round(event.clientX - box.left) + 'px');
        stage.style.setProperty('--my', Math.round(event.clientY - box.top) + 'px');
      });
    });
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
