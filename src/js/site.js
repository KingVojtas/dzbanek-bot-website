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

  /* ---- phones: the floating invite steps aside while another one is on screen ---- */

  const sticky = document.querySelector('.sticky-invite');
  if (sticky && 'IntersectionObserver' in window) {
    const onScreen = new Set();
    const others = Array.from(document.querySelectorAll('.btn[data-invite]')).filter(
      (button) => !sticky.contains(button) && !button.closest('.site-header')
    );
    const watcher = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) onScreen.add(entry.target);
        else onScreen.delete(entry.target);
      });
      sticky.classList.toggle('is-tucked', onScreen.size > 0);
    });
    // Tucked until the first answer, so it slides in rather than flashing on and off.
    if (others.length) sticky.classList.add('is-tucked');
    others.forEach((button) => watcher.observe(button));
  }

  /* ---- a few cookies pop out of a button when you point at it ---- */

  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!calm && mouse) {
    const jar = document.createElement('div');
    jar.className = 'crumbs';
    jar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(jar);

    document.addEventListener('pointerover', (event) => {
      const button = event.target.closest('.btn');
      if (!button || button.contains(event.relatedTarget)) return;
      // Once per visit to the button, and not again for a moment.
      const now = performance.now();
      if (now - Number(button.dataset.crumbs || 0) < 900) return;
      button.dataset.crumbs = String(now);

      const box = button.getBoundingClientRect();
      // Near the top of the screen they'd fly out of sight, so they fall instead.
      const up = box.top > 70 ? -1 : 1;
      for (let i = 0; i < 4; i++) {
        const cookie = document.createElement('span');
        cookie.textContent = '🍪';
        cookie.style.left = (box.left + box.width * (0.2 + Math.random() * 0.6)).toFixed(0) + 'px';
        cookie.style.top = (up < 0 ? box.top + 6 : box.bottom - 6).toFixed(0) + 'px';
        cookie.style.setProperty('--dx', (Math.random() * 70 - 35).toFixed(0) + 'px');
        cookie.style.setProperty('--dy', (up * (26 + Math.random() * 30)).toFixed(0) + 'px');
        cookie.style.setProperty('--spin', (Math.random() * 300 - 150).toFixed(0) + 'deg');
        cookie.style.animationDelay = i * 45 + 'ms';
        cookie.addEventListener('animationend', () => cookie.remove());
        jar.appendChild(cookie);
      }
    });
  }

  /* ---- home: the shelf radio tunes to the key you point at, and plays the one you press ---- */

  const shelfRadio = document.querySelector('[data-kradio]');
  if (shelfRadio) {
    const NEEDLE = { kiss: '18%', rock: '50%', beat: '82%' };
    const KNOB = { kiss: '-70deg', rock: '0deg', beat: '70deg' };
    const keys = Array.from(shelfRadio.querySelectorAll('[data-key]'));
    const labels = Array.from(shelfRadio.querySelectorAll('[data-for]'));
    const slogan = shelfRadio.querySelector('[data-kradio-slogan]');
    const hint = shelfRadio.closest('.shelf-radio').querySelector('[data-kradio-hint]');
    const radio = window.dzbanekRadio;
    let playing = null;

    const tune = (station) => {
      shelfRadio.style.setProperty('--tuned', 'var(--' + station + ')');
      shelfRadio.style.setProperty('--needle', NEEDLE[station]);
      shelfRadio.style.setProperty('--knob', KNOB[station]);
      keys.forEach((key) => {
        const on = key.dataset.key === station;
        key.classList.toggle('is-on', on);
        if (on && slogan && !playing) slogan.textContent = key.dataset.slogan;
      });
      labels.forEach((label) => label.classList.toggle('is-on', label.dataset.for === station));
    };

    // It stays on the last station you pointed at, the way a real dial would.
    // While one plays, the dial stays on it.
    keys.forEach((key) => {
      key.addEventListener('pointerenter', () => playing || tune(key.dataset.key));
      key.addEventListener('focus', () => playing || tune(key.dataset.key));
      key.addEventListener('click', () => {
        tune(key.dataset.key);
        if (radio) radio.toggle(key.dataset.key);
      });
    });

    if (radio) {
      const say = (key, fallback) => (window.t && window.t(key)) || fallback;
      let last = { station: null, state: 'off', song: null };
      const show = ({ station, state, song }) => {
        last = { station, state, song };
        playing = station;
        shelfRadio.dataset.state = state;
        keys.forEach((key) => key.setAttribute('aria-pressed', String(key.dataset.key === station)));
        if (hint) hint.classList.toggle('is-live', state === 'on');
        if (!slogan) return;
        if (state === 'tuning') slogan.textContent = say('radioLive.tuning', 'Tuning in…');
        else if (state === 'error') slogan.textContent = say('radioLive.error', 'The station isn’t answering');
        else if (state === 'on') slogan.textContent = song ? song.artist + ' – ' + song.title : say('radioLive.onAir', 'On air');
        else {
          const tuned = keys.find((key) => key.classList.contains('is-on'));
          if (tuned) slogan.textContent = tuned.dataset.slogan;
        }
      };
      radio.onChange(show);
      window.addEventListener('dzbanek:lang', () => show(last));
    }
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
