/**
 * Fetch and normalize bot stats.
 *
 * Order:
 *   1. Live API (config API_BASE + /api/stats) when configured
 *   2. Static snapshot data/stats.json (works on GitHub Pages / custom domain)
 *
 * Supports both payload shapes:
 *   { serverCount, userCount, uptime }
 *   { servers, approxUsers, totalPlays, uptimeSec, history, ... }
 */
(function (global) {
  function apiBase() {
    if (global.DZBANEK && typeof global.DZBANEK.refreshApiBase === 'function') {
      return String(global.DZBANEK.refreshApiBase() || '').replace(/\/$/, '');
    }
    const base = (global.DZBANEK && global.DZBANEK.API_BASE) || '';
    if (base) return String(base).replace(/\/$/, '');
    try {
      if (typeof location !== 'undefined' && location.origin && location.origin !== 'null') {
        const h = location.hostname;
        if (h === 'localhost' || h === '127.0.0.1') return 'http://127.0.0.1:3848';
      }
    } catch (e) {
      /* ignore */
    }
    return '';
  }

  function snapshotUrl() {
    const path =
      (global.DZBANEK && global.DZBANEK.STATS_SNAPSHOT) || 'data/stats.json';
    // Resolve relative to current page directory (works on / and /stats.html)
    try {
      return new URL(path, location.href).href;
    } catch (e) {
      return path;
    }
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
    const source =
      typeof raw.source === 'string'
        ? raw.source
        : null;

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
      source,
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

  async function fetchLiveStats() {
    const base = apiBase();
    if (!base) return null;
    // Block mixed content: HTTPS page → HTTP API
    try {
      if (
        typeof location !== 'undefined' &&
        location.protocol === 'https:' &&
        base.startsWith('http://')
      ) {
        return null;
      }
    } catch (e) {
      /* ignore */
    }
    const res = await fetch(base + '/api/stats', {
      credentials: 'omit',
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const raw = await res.json();
    const normalized = normalizeStats(raw);
    if (!normalized) throw new Error('Invalid stats payload');
    normalized.source = normalized.source || 'live';
    return normalized;
  }

  async function fetchSnapshotStats() {
    const res = await fetch(snapshotUrl(), {
      credentials: 'omit',
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Snapshot HTTP ' + res.status);
    const raw = await res.json();
    const normalized = normalizeStats(raw);
    if (!normalized) throw new Error('Invalid snapshot');
    normalized.source = normalized.source || 'snapshot';
    // Snapshot uptime is stale — don't pretend the process is still up
    if (normalized.source === 'snapshot') {
      normalized.uptimeSec = null;
    }
    return normalized;
  }

  /**
   * Live API first, then public snapshot (for GitHub Pages / custom domain).
   */
  async function fetchStats() {
    try {
      const live = await fetchLiveStats();
      if (live) return live;
    } catch (e) {
      // fall through to snapshot
    }
    return fetchSnapshotStats();
  }

  async function fetchHealth() {
    try {
      const base = apiBase();
      if (!base) return { ok: false, snapshot: true };
      try {
        if (
          typeof location !== 'undefined' &&
          location.protocol === 'https:' &&
          base.startsWith('http://')
        ) {
          return { ok: false, snapshot: true };
        }
      } catch (e) {
        /* ignore */
      }
      const res = await fetch(base + '/api/health', {
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
    snapshotUrl,
    normalizeStats,
    formatNum,
    formatUptime,
    fetchStats,
    fetchLiveStats,
    fetchSnapshotStats,
    fetchHealth,
  };
})(typeof window !== 'undefined' ? window : globalThis);
