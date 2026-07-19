/**
 * Invite setup wizard — invite → pick modules → checklist.
 * Progress in localStorage.dzbanek_setup_wizard
 */
(function () {
  var STORAGE = 'dzbanek_setup_wizard';
  var MODULES = [
    { id: 'music', icon: '🎵', i18n: 'wizard.mod_music', def: true },
    { id: 'deals', icon: '🔥', i18n: 'wizard.mod_deals', def: true },
    { id: 'news', icon: '📰', i18n: 'wizard.mod_news', def: false },
    { id: 'levels', icon: '🏅', i18n: 'wizard.mod_levels', def: false },
    { id: 'welcome', icon: '👋', i18n: 'wizard.mod_welcome', def: false },
  ];

  function t(key, vars) {
    if (window.DZBANEK_I18N && typeof window.DZBANEK_I18N.t === 'function') {
      var v = window.DZBANEK_I18N.t(key, vars);
      if (v && v !== key) return v;
    }
    return key;
  }

  function inviteUrl() {
    return (window.DZBANEK && window.DZBANEK.INVITE_URL) || '#';
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE);
      if (raw) {
        var o = JSON.parse(raw);
        if (o && typeof o === 'object') return o;
      }
    } catch (e) {
      /* ignore */
    }
    var mods = {};
    MODULES.forEach(function (m) {
      mods[m.id] = m.def;
    });
    return { step: 1, modules: mods };
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(state));
    } catch (e) {
      /* ignore */
    }
  }

  function checklistItems(mods) {
    var items = [
      {
        id: 'invite',
        always: true,
        titleKey: 'wizard.check_invite',
        bodyKey: 'wizard.check_invite_body',
        href: inviteUrl(),
        external: true,
        ctaKey: 'wizard.cta_invite',
      },
    ];
    if (mods.music !== false) {
      items.push({
        id: 'music',
        titleKey: 'wizard.check_music',
        bodyKey: 'wizard.check_music_body',
        href: 'permissions.html',
        ctaKey: 'wizard.cta_perms',
      });
    }
    if (mods.deals) {
      items.push({
        id: 'steam',
        titleKey: 'wizard.check_steam',
        bodyKey: 'wizard.check_steam_body',
        copy: '/setup steam',
        ctaKey: 'wizard.cta_copy',
      });
      items.push({
        id: 'epic',
        titleKey: 'wizard.check_epic',
        bodyKey: 'wizard.check_epic_body',
        copy: '/setup epic',
        ctaKey: 'wizard.cta_copy',
      });
    }
    if (mods.news) {
      items.push({
        id: 'news',
        titleKey: 'wizard.check_news',
        bodyKey: 'wizard.check_news_body',
        copy: '/setup news',
        ctaKey: 'wizard.cta_copy',
      });
    }
    if (mods.levels) {
      items.push({
        id: 'levels',
        titleKey: 'wizard.check_levels',
        bodyKey: 'wizard.check_levels_body',
        href: 'admin.html',
        ctaKey: 'wizard.cta_admin',
      });
    }
    if (mods.welcome) {
      items.push({
        id: 'welcome',
        titleKey: 'wizard.check_welcome',
        bodyKey: 'wizard.check_welcome_body',
        href: 'admin.html',
        ctaKey: 'wizard.cta_admin',
      });
    }
    items.push({
      id: 'status',
      always: true,
      titleKey: 'wizard.check_status',
      bodyKey: 'wizard.check_status_body',
      href: 'check.html',
      ctaKey: 'wizard.cta_check',
    });
    return items;
  }

  function init() {
    var root = document.getElementById('setup-wizard');
    if (!root) return;

    var state = loadState();
    var stepEls = root.querySelectorAll('[data-wizard-step]');
    var dots = root.querySelectorAll('[data-wizard-dot]');
    var modulesHost = document.getElementById('wizard-modules');
    var checklistHost = document.getElementById('wizard-checklist');

    function setStep(n) {
      state.step = Math.max(1, Math.min(3, n));
      saveState(state);
      stepEls.forEach(function (el) {
        var s = Number(el.getAttribute('data-wizard-step'));
        el.hidden = s !== state.step;
      });
      dots.forEach(function (d, i) {
        var on = i + 1 === state.step;
        var done = i + 1 < state.step;
        d.classList.toggle('is-active', on);
        d.classList.toggle('is-done', done);
        d.setAttribute('aria-current', on ? 'step' : 'false');
      });
      if (state.step === 2) renderModules();
      if (state.step === 3) renderChecklist();
    }

    function renderModules() {
      if (!modulesHost) return;
      modulesHost.innerHTML = MODULES.map(function (m) {
        var on = !!state.modules[m.id];
        return (
          '<button type="button" class="wizard-mod' +
          (on ? ' is-on' : '') +
          '" data-mod="' +
          m.id +
          '" aria-pressed="' +
          (on ? 'true' : 'false') +
          '">' +
          '<span class="wizard-mod-icon" aria-hidden="true">' +
          m.icon +
          '</span>' +
          '<span class="wizard-mod-label" data-i18n="' +
          m.i18n +
          '">' +
          t(m.i18n) +
          '</span>' +
          '<span class="wizard-mod-check" aria-hidden="true">' +
          (on ? '✓' : '') +
          '</span>' +
          '</button>'
        );
      }).join('');
      modulesHost.querySelectorAll('[data-mod]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-mod');
          state.modules[id] = !state.modules[id];
          saveState(state);
          renderModules();
        });
      });
      if (window.DZBANEK_I18N && window.DZBANEK_I18N.apply) {
        try {
          window.DZBANEK_I18N.apply(modulesHost);
        } catch (e) {
          /* ignore */
        }
      }
    }

    function renderChecklist() {
      if (!checklistHost) return;
      var items = checklistItems(state.modules);
      checklistHost.innerHTML = items
        .map(function (it, i) {
          var actions = '';
          if (it.copy) {
            actions =
              '<button type="button" class="wizard-check-cta" data-copy="' +
              it.copy.replace(/"/g, '&quot;') +
              '">' +
              t(it.ctaKey) +
              ' <code>' +
              it.copy +
              '</code></button>';
          } else if (it.href) {
            actions =
              '<a class="wizard-check-cta" href="' +
              it.href +
              '"' +
              (it.external ? ' target="_blank" rel="noopener noreferrer"' : '') +
              '>' +
              t(it.ctaKey) +
              '</a>';
          }
          return (
            '<li class="wizard-check-item">' +
            '<span class="wizard-check-n">' +
            (i + 1) +
            '</span>' +
            '<div class="min-w-0 flex-1">' +
            '<p class="wizard-check-title">' +
            t(it.titleKey) +
            '</p>' +
            '<p class="wizard-check-body">' +
            t(it.bodyKey) +
            '</p>' +
            '<div class="mt-2">' +
            actions +
            '</div></div></li>'
          );
        })
        .join('');
      checklistHost.querySelectorAll('[data-copy]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var cmd = btn.getAttribute('data-copy') || '';
          if (window.copyText) window.copyText(cmd);
          else if (navigator.clipboard) navigator.clipboard.writeText(cmd);
          if (window.showToast) window.showToast(t('commands.copied') || 'Copied');
        });
      });
    }

    root.querySelectorAll('[data-wizard-next]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setStep(state.step + 1);
      });
    });
    root.querySelectorAll('[data-wizard-back]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setStep(state.step - 1);
      });
    });
    root.querySelectorAll('[data-wizard-goto]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setStep(Number(btn.getAttribute('data-wizard-goto')) || 1);
      });
    });

    var inviteBtn = document.getElementById('wizard-invite-btn');
    if (inviteBtn) {
      inviteBtn.href = inviteUrl();
      inviteBtn.addEventListener('click', function () {
        /* keep step; user can advance manually */
      });
    }

    document.addEventListener('dzbanek:lang', function () {
      if (state.step === 2) renderModules();
      if (state.step === 3) renderChecklist();
    });

    setStep(state.step || 1);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
