/**
 * Lightweight EN/CS i18n for static pages.
 *
 * Preference: ?lang= → localStorage.dzbanek_lang → browser (cs/sk) → en
 * Markup: data-i18n, data-i18n-html, data-i18n-placeholder, data-i18n-title, data-i18n-aria
 * Toggle:  data-set-lang="en|cs"
 */
(function () {
  var STORAGE_KEY = 'dzbanek_lang';
  var SUPPORTED = { en: true, cs: true };
  var missing = Object.create(null);

  function getLocales() {
    return (typeof window !== 'undefined' && window.DZBANEK_LOCALES) || {};
  }

  function resolvePath(obj, path) {
    if (!obj || !path) return undefined;
    var parts = String(path).split('.');
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null || typeof cur !== 'object') return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  function detectBrowserLang() {
    try {
      var list = [];
      if (typeof navigator !== 'undefined') {
        if (navigator.languages && navigator.languages.length) {
          list = navigator.languages.slice();
        } else if (navigator.language) {
          list = [navigator.language];
        }
      }
      for (var i = 0; i < list.length; i++) {
        var code = String(list[i] || '')
          .toLowerCase()
          .split('-')[0];
        if (code === 'cs' || code === 'sk') return 'cs';
      }
    } catch (e) {
      /* ignore */
    }
    return null;
  }

  function readQueryLang() {
    try {
      var q = new URLSearchParams(location.search).get('lang');
      if (q) {
        q = String(q).toLowerCase();
        if (SUPPORTED[q]) return q;
      }
    } catch (e) {
      /* ignore */
    }
    return null;
  }

  function readStoredLang() {
    try {
      var s = localStorage.getItem(STORAGE_KEY);
      if (s && SUPPORTED[s]) return s;
    } catch (e) {
      /* ignore */
    }
    return null;
  }

  function resolveLang() {
    return readQueryLang() || readStoredLang() || detectBrowserLang() || 'en';
  }

  function interpolate(str, vars) {
    if (!vars || typeof str !== 'string') return str;
    return str.replace(/\{\{(\w+)\}\}/g, function (_, k) {
      return vars[k] != null ? String(vars[k]) : '';
    });
  }

  function t(key, vars) {
    var locales = getLocales();
    var lang = api.lang || 'en';
    var val = resolvePath(locales[lang], key);
    if (val == null && lang !== 'en') {
      val = resolvePath(locales.en, key);
    }
    if (val == null) {
      if (!missing[key]) {
        missing[key] = true;
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('[i18n] missing key:', key);
        }
      }
      return typeof key === 'string' ? key : '';
    }
    if (typeof val !== 'string') return String(val);
    return interpolate(val, vars);
  }

  function apply(root) {
    var scope = root || document;
    if (!scope || !scope.querySelectorAll) return;

    scope.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (!key) return;
      el.textContent = t(key);
    });

    scope.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      if (!key) return;
      el.innerHTML = t(key);
    });

    scope.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (!key) return;
      el.setAttribute('placeholder', t(key));
    });

    scope.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-title');
      if (!key) return;
      el.setAttribute('title', t(key));
    });

    scope.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria');
      if (!key) return;
      el.setAttribute('aria-label', t(key));
    });

    document.documentElement.lang = api.lang === 'cs' ? 'cs' : 'en';

    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      var desc = t('meta.description');
      if (desc && desc !== 'meta.description') metaDesc.setAttribute('content', desc);
    }

    var ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) {
      ogLocale.setAttribute('content', api.lang === 'cs' ? 'cs_CZ' : 'en_US');
    } else {
      var head = document.head;
      if (head) {
        var m = document.createElement('meta');
        m.setAttribute('property', 'og:locale');
        m.setAttribute('content', api.lang === 'cs' ? 'cs_CZ' : 'en_US');
        head.appendChild(m);
      }
    }

    syncToggleButtons();
  }

  function syncToggleButtons() {
    document.querySelectorAll('[data-set-lang]').forEach(function (btn) {
      var lang = btn.getAttribute('data-set-lang');
      var on = lang === api.lang;
      btn.setAttribute('aria-pressed', String(on));
      btn.classList.toggle('is-lang-active', on);
      if (on) {
        btn.classList.add('bg-discord-blurple', 'text-white');
        btn.classList.remove('text-discord-muted', 'hover:text-white');
      } else {
        btn.classList.remove('bg-discord-blurple', 'text-white');
        btn.classList.add('text-discord-muted');
      }
    });
  }

  function setLang(lang, opts) {
    opts = opts || {};
    lang = String(lang || '').toLowerCase();
    if (!SUPPORTED[lang]) return;
    api.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      /* ignore */
    }
    if (opts.updateQuery !== false) {
      try {
        var url = new URL(location.href);
        url.searchParams.set('lang', lang);
        history.replaceState(null, '', url.pathname + url.search + url.hash);
      } catch (e2) {
        /* ignore */
      }
    }
    apply();
    try {
      document.dispatchEvent(
        new CustomEvent('dzbanek:lang', { detail: { lang: lang } }),
      );
    } catch (e3) {
      /* ignore */
    }
  }

  function bindToggles() {
    document.addEventListener('click', function (e) {
      var tEl = e.target && e.target.closest ? e.target.closest('[data-set-lang]') : null;
      if (!tEl) return;
      e.preventDefault();
      setLang(tEl.getAttribute('data-set-lang'));
    });
  }

  var api = {
    lang: 'en',
    t: t,
    setLang: setLang,
    apply: apply,
    STORAGE_KEY: STORAGE_KEY,
  };

  api.lang = resolveLang();
  // Persist query choice on first paint
  try {
    if (readQueryLang()) {
      localStorage.setItem(STORAGE_KEY, api.lang);
    }
  } catch (e) {
    /* ignore */
  }

  window.DZBANEK_I18N = api;
  window.t = t;

  function boot() {
    bindToggles();
    apply();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
