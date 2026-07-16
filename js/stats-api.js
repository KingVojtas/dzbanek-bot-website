/**
 * Fetch and normalize live bot stats (default http://127.0.0.1:3848/api/stats).
 *
 * Supports both payload shapes:
 *   { serverCount, userCount, uptime }
 *   { servers, approxUsers, totalPlays, uptimeSec, history, ... }
 */
(function (global) {
  function apiBase() {
    const base = (global.DZBANEK && global.DZBANEK.API_BASE) || 'http://127.0.0.1:3848';
    return String(base).replace(/\/$/, '');
  }

  /**
   * @param {Record<string, unknown>} raw
   */
  function normalizeStats(raw) {
    if (!raw || typeof raw !== 'object') {
      return null;
    }
    const servers = num(raw.servers ?? raw.serverCount);
    const users = num(raw.approxUsers ?? raw.userCount ?? raw.users);
    const uptimeSec = num(raw.uptimeSec ?? raw.uptime);
    const totalPlays = num(raw.totalPlays ?? raw.plays);
    const totalSkips = num(raw.totalSkips ?? raw.skips);
    const totalWishlistAdds = num(raw.totalWishlistAdds ?? raw.wishlistAdds);
    const uniqueUsersTracked = num(raw.uniqueUsersTracked ?? raw.trackedUsers);
    const history = Array.isArray(raw.history) ? raw.history : [];

    return {
      servers,
      users,
      uptimeSec,
      totalPlays,
      totalSkips,
      totalWishlistAdds,
      uniqueUsersTracked,
      history,
      generatedAt: typeof raw.generatedAt === 'string' ? raw.generatedAt : new Date().toISOString(),
      raw,
    };
  }

  function num(v) {
    if (v == null || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function formatNum(n) {
    if (n == null) return '—';
    return Number(n).toLocaleString();
  }

  function formatUptime(sec) {
    if (sec == null || Number.isNaN(Number(sec))) return '—';
    const s = Math.max(0, Math.floor(Number(sec)));
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  async function fetchStats() {
    const res = await fetch(apiBase() + '/api/stats', {
      credentials: 'omit',
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const raw = await res.json();
    const normalized = normalizeStats(raw);
    if (!normalized) throw new Error('Invalid stats payload');
    return normalized;
  }

  async function fetchHealth() {
    try {
      const res = await fetch(apiBase() + '/api/health', {
        credentials: 'omit',
        cache: 'no-store',
      });
      if (!res.ok) return { ok: false };
      const data = await res.json();
      return {
        ok: Boolean(data.ok),
        ready: Boolean(data.ready),
        uptimeSec: num(data.uptimeSec ?? data.uptime),
      };
    } catch {
      return { ok: false };
    }
  }

  global.DzbanekStats = {
    apiBase,
    normalizeStats,
    formatNum,
    formatUptime,
    fetchStats,
    fetchHealth,
  };
})(typeof window !== 'undefined' ? window : globalThis);
