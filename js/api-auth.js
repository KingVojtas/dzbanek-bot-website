/**
 * Shared Discord OAuth session helpers (admin + server checker).
 * Session token: sessionStorage.dzbanek_admin_session (handoff from ?session=)
 */
(function (global) {
  var SESSION_KEY = 'dzbanek_admin_session';
  var FALLBACK_PUBLIC_API = 'https://dzbanek-bot.up.railway.app';
  var DEAD_HOSTS = ['bot-production-c393.up.railway.app'];

  function isDead(url) {
    try {
      if (global.DZBANEK && typeof global.DZBANEK.isDeadApiBase === 'function') {
        return global.DZBANEK.isDeadApiBase(url);
      }
      var h = new URL(String(url || '')).hostname.toLowerCase();
      return DEAD_HOSTS.indexOf(h) !== -1;
    } catch (e) {
      return false;
    }
  }

  function apiBase() {
    if (global.DZBANEK && typeof global.DZBANEK.refreshApiBase === 'function') {
      var b = String(global.DZBANEK.refreshApiBase() || '').replace(/\/$/, '');
      if (b && !isDead(b)) return b;
    }
    var base =
      (global.DZBANEK && (global.DZBANEK.API_BASE || global.DZBANEK.PRODUCTION_API_BASE)) || '';
    if (base) {
      base = String(base).replace(/\/$/, '');
      if (!isDead(base)) return base;
    }
    try {
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        if (String(location.port) === '3848') return location.origin;
        return 'http://127.0.0.1:3848';
      }
      if (/\.up\.railway\.app$/i.test(location.hostname) && !isDead(location.origin)) {
        return location.origin;
      }
      return FALLBACK_PUBLIC_API;
    } catch (e) {
      return FALLBACK_PUBLIC_API;
    }
  }

  function getSession() {
    try {
      return sessionStorage.getItem(SESSION_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  function setSession(token) {
    try {
      if (token) sessionStorage.setItem(SESSION_KEY, token);
      else sessionStorage.removeItem(SESSION_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  /** Capture ?session= handoff from OAuth callback */
  function captureHandoff() {
    try {
      var params = new URLSearchParams(location.search);
      var handoff = params.get('session');
      if (!handoff) return false;
      setSession(handoff);
      params.delete('session');
      var clean =
        location.pathname + (params.toString() ? '?' + params.toString() : '') + location.hash;
      history.replaceState({}, '', clean);
      return true;
    } catch (e) {
      return false;
    }
  }

  function loginUrl(returnPage) {
    var ret = returnPage;
    if (!ret) {
      try {
        // Full page URL so the bot can return to check.html or admin.html
        ret = location.href.split('#')[0].split('?')[0];
      } catch (e) {
        ret = location.origin + '/admin.html';
      }
    }
    // Always absolute https API base (never relative)
    var base = apiBase().replace(/\/$/, '');
    if (!base) base = FALLBACK_PUBLIC_API;
    return base + '/api/auth/login?return=' + encodeURIComponent(ret);
  }

  async function api(path, opts) {
    opts = opts || {};
    var headers = Object.assign({}, opts.headers || {});
    var token = getSession();
    if (token) headers.Authorization = 'Bearer ' + token;
    if (opts.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    return fetch(apiBase() + path, Object.assign({}, opts, {
      credentials: 'include',
      headers: headers,
      cache: 'no-store',
    }));
  }

  function normalizeGuilds(data) {
    if (data && Array.isArray(data.guilds)) return data.guilds;
    if (Array.isArray(data)) return data;
    return [];
  }

  global.DzbanekAuth = {
    SESSION_KEY: SESSION_KEY,
    apiBase: apiBase,
    getSession: getSession,
    setSession: setSession,
    captureHandoff: captureHandoff,
    loginUrl: loginUrl,
    api: api,
    normalizeGuilds: normalizeGuilds,
  };
})(typeof window !== 'undefined' ? window : globalThis);
