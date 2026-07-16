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
    const publicBlock = normalizePublic(raw.public ?? raw.publicActivity);

    return {
      servers,
      users,
      uptimeSec,
      totalPlays,
      totalSkips,
      totalWishlistAdds,
      uniqueUsersTracked,
      history,
      public: publicBlock,
      generatedAt: typeof raw.generatedAt === 'string' ? raw.generatedAt : new Date().toISOString(),
      source,
      raw,
    };
  }

  function asArray(v) {
    return Array.isArray(v) ? v : [];
  }

  /**
   * Optional public marketing aggregates (safe: no user IDs).
   * @param {unknown} block
   */
  function normalizePublic(block) {
    const empty = {
      topTracks: [],
      recentDeals: [],
      milestones: [],
      topServers: [],
      nowPlaying: null,
      recentCommands: [],
    };
    if (!block || typeof block !== 'object') return empty;
    const b = /** @type {Record<string, unknown>} */ (block);

    const topTracks = asArray(b.topTracks)
      .map((row) => {
        if (!row || typeof row !== 'object') return null;
        const r = /** @type {Record<string, unknown>} */ (row);
        const title = String(r.title || r.name || r.key || '').trim();
        if (!title) return null;
        return {
          title,
          plays: num(r.plays ?? r.count) ?? 0,
          durationSec: num(r.durationSec ?? r.duration ?? r.lengthSec),
        };
      })
      .filter(Boolean)
      .slice(0, 3);

    const recentDeals = asArray(b.recentDeals)
      .map((row) => {
        if (!row || typeof row !== 'object') return null;
        const r = /** @type {Record<string, unknown>} */ (row);
        const title = String(r.title || r.name || '').trim();
        if (!title) return null;
        const src = String(r.source || '').toLowerCase();
        return {
          source: src === 'epic' ? 'epic' : src === 'steam' ? 'steam' : 'other',
          title,
          subtitle: String(r.subtitle || r.detail || r.discount || '').trim(),
        };
      })
      .filter(Boolean)
      .slice(0, 8);

    const milestones = asArray(b.milestones)
      .map((row) => {
        if (!row || typeof row !== 'object') return null;
        const r = /** @type {Record<string, unknown>} */ (row);
        const text = String(r.text || r.message || '').trim();
        if (!text) return null;
        const id =
          typeof r.id === 'string' && r.id
            ? r.id
            : 'ms-' + text.slice(0, 48).replace(/\s+/g, '-').toLowerCase();
        return {
          id,
          text,
          at: typeof r.at === 'string' ? r.at : null,
        };
      })
      .filter(Boolean)
      .slice(0, 10);

    const topServers = asArray(b.topServers)
      .map((row) => {
        if (!row || typeof row !== 'object') return null;
        const r = /** @type {Record<string, unknown>} */ (row);
        const name = String(r.name || r.displayName || '').trim();
        if (!name) return null;
        return {
          name,
          plays: num(r.plays ?? r.count) ?? 0,
        };
      })
      .filter(Boolean);

    let nowPlaying = null;
    const np = b.nowPlaying;
    if (np && typeof np === 'object') {
      const r = /** @type {Record<string, unknown>} */ (np);
      const title = String(r.title || r.name || '').trim();
      if (title) {
        nowPlaying = {
          title,
          artist: String(r.artist || r.author || '').trim(),
          albumArtUrl: String(r.albumArtUrl || r.thumbnail || r.artworkUrl || '').trim() || null,
          guildName: r.guildName != null ? String(r.guildName) : null,
        };
      }
    }

    const recentCommands = asArray(b.recentCommands)
      .map((row) => {
        if (typeof row === 'string') {
          const cmd = row.trim();
          return cmd ? { command: cmd, at: null } : null;
        }
        if (!row || typeof row !== 'object') return null;
        const r = /** @type {Record<string, unknown>} */ (row);
        const command = String(r.command || r.name || r.cmd || '').trim();
        if (!command) return null;
        return {
          command: command.startsWith('/') ? command : '/' + command,
          at: typeof r.at === 'string' ? r.at : null,
        };
      })
      .filter(Boolean)
      .slice(0, 12);

    return {
      topTracks,
      recentDeals,
      milestones,
      topServers,
      nowPlaying,
      recentCommands,
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

  /** Track duration: seconds → m:ss or h:mm:ss */
  function formatDuration(sec) {
    if (sec == null || Number.isNaN(Number(sec))) return null;
    const s = Math.max(0, Math.floor(Number(sec)));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    if (h > 0) {
      return h + ':' + String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0');
    }
    return m + ':' + String(r).padStart(2, '0');
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
   * Never invent marketing rows — only real API / exported snapshot fields.
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

  /**
   * Stats + public activity block (for live wall / leaderboards).
   */
  async function fetchPublicActivity() {
    const stats = await fetchStats();
    return {
      stats,
      public: stats.public || normalizePublic(null),
      source: stats.source,
      generatedAt: stats.generatedAt,
    };
  }

  global.DzbanekStats = {
    apiBase,
    snapshotUrl,
    normalizeStats,
    normalizePublic,
    formatNum,
    formatUptime,
    formatDuration,
    fetchStats,
    fetchLiveStats,
    fetchSnapshotStats,
    fetchHealth,
    fetchPublicActivity,
  };
})(typeof window !== 'undefined' ? window : globalThis);
