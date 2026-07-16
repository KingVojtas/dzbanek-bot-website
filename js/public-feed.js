/**
 * Render live activity wall + leaderboards from real DzbanekStats only.
 * No sample tracks/deals — optional API `public` fields when the bot provides them.
 */
(function (global) {
  function t(key, vars) {
    if (global.DZBANEK_I18N && typeof global.DZBANEK_I18N.t === 'function') {
      return global.DZBANEK_I18N.t(key, vars);
    }
    return key;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function rowMetric(label, value) {
    return (
      '<li class="flex items-center justify-between gap-3 border-b border-white/5 py-2.5 last:border-0">' +
      '<span class="text-sm text-discord-muted">' +
      escapeHtml(label) +
      '</span>' +
      '<span class="text-sm font-semibold text-white">' +
      escapeHtml(value) +
      '</span></li>'
    );
  }

  /**
   * Build honest wall content from live/snapshot stats (+ optional public{}).
   */
  function buildNowModel(pack) {
    const S = global.DzbanekStats;
    const stats = (pack && pack.stats) || pack || {};
    const pub = (pack && pack.public) || stats.public || {};
    const fmt = S ? S.formatNum.bind(S) : function (n) {
      return n == null ? '—' : String(n);
    };
    const up = S ? S.formatUptime.bind(S) : function () {
      return '—';
    };

    const liveRows = [
      { label: t('now.metric_servers'), value: fmt(stats.servers) },
      { label: t('now.metric_users'), value: fmt(stats.users) },
      { label: t('now.metric_plays'), value: fmt(stats.totalPlays) },
      { label: t('now.metric_uptime'), value: up(stats.uptimeSec) },
    ];

    const activityRows = [
      { label: t('now.metric_skips'), value: fmt(stats.totalSkips) },
      { label: t('now.metric_wishlist'), value: fmt(stats.totalWishlistAdds) },
      { label: t('now.metric_tracked'), value: fmt(stats.uniqueUsersTracked) },
    ];

    // Optional real rankings from bot — never fabricated
    const topTracks = Array.isArray(pub.topTracks) ? pub.topTracks : [];
    const recentDeals = Array.isArray(pub.recentDeals) ? pub.recentDeals : [];

    const milestones = [];
    if (stats.servers != null) {
      milestones.push({
        text: t('now.ms_servers', { n: fmt(stats.servers) }),
        at: stats.generatedAt || null,
      });
    }
    if (stats.totalPlays != null) {
      milestones.push({
        text: t('now.ms_plays', { n: fmt(stats.totalPlays) }),
        at: stats.generatedAt || null,
      });
    }
    if (stats.users != null) {
      milestones.push({
        text: t('now.ms_users', { n: fmt(stats.users) }),
        at: stats.generatedAt || null,
      });
    }
    // Bot-provided milestones only if real
    if (Array.isArray(pub.milestones)) {
      pub.milestones.forEach(function (m) {
        if (m && m.text) milestones.push(m);
      });
    }

    var sourceLabel = '';
    if (pack && pack.source === 'live') {
      sourceLabel = t('now.source_live');
    } else if (pack && pack.source === 'snapshot') {
      sourceLabel = t('now.source_snapshot');
    }
    if (stats.generatedAt) {
      try {
        sourceLabel +=
          (sourceLabel ? ' · ' : '') +
          t('now.updated', { when: new Date(stats.generatedAt).toLocaleString() });
      } catch (e) {
        /* ignore */
      }
    }

    return {
      liveRows: liveRows,
      activityRows: activityRows,
      topTracks: topTracks,
      recentDeals: recentDeals,
      milestones: milestones,
      note: sourceLabel,
      stats: stats,
      public: pub,
      source: pack && pack.source,
    };
  }

  function renderMetricList(el, rows) {
    if (!el) return;
    if (!rows || !rows.length) {
      el.innerHTML =
        '<p class="text-sm text-discord-muted py-2">' + t('now.empty') + '</p>';
      return;
    }
    el.innerHTML = rows
      .map(function (r) {
        return rowMetric(r.label, r.value);
      })
      .join('');
  }

  function renderTrackList(el, tracks) {
    if (!el) return;
    if (!tracks || !tracks.length) {
      el.innerHTML =
        '<p class="text-sm text-discord-muted py-2">' + t('now.empty_tracks') + '</p>';
      return;
    }
    el.innerHTML = tracks
      .map(function (row, i) {
        return (
          '<li class="flex items-center justify-between gap-3 border-b border-white/5 py-2.5 last:border-0">' +
          '<span class="min-w-0 truncate text-sm text-white"><span class="text-discord-muted mr-2">' +
          (i + 1) +
          '.</span>' +
          escapeHtml(row.title) +
          '</span>' +
          '<span class="shrink-0 text-xs text-discord-muted">' +
          escapeHtml(t('now.plays', { n: Number(row.plays) || 0 })) +
          '</span></li>'
        );
      })
      .join('');
  }

  function renderDealsList(el, deals) {
    if (!el) return;
    if (!deals || !deals.length) {
      el.innerHTML =
        '<p class="text-sm text-discord-muted py-2">' + t('now.empty_deals') + '</p>';
      return;
    }
    el.innerHTML = deals
      .map(function (row) {
        const badge =
          row.source === 'epic' ? 'Epic' : row.source === 'steam' ? 'Steam' : 'Deal';
        return (
          '<li class="border-b border-white/5 py-2.5 last:border-0">' +
          '<p class="text-xs font-semibold text-discord-blurple">' +
          escapeHtml(badge) +
          '</p>' +
          '<p class="text-sm font-medium text-white">' +
          escapeHtml(row.title) +
          '</p>' +
          (row.subtitle
            ? '<p class="text-xs text-discord-muted mt-0.5">' +
              escapeHtml(row.subtitle) +
              '</p>'
            : '') +
          '</li>'
        );
      })
      .join('');
  }

  function renderMilestoneList(el, items) {
    if (!el) return;
    if (!items || !items.length) {
      el.innerHTML =
        '<p class="text-sm text-discord-muted py-2">' + t('now.empty') + '</p>';
      return;
    }
    el.innerHTML = items
      .map(function (row) {
        var when = '';
        if (row.at) {
          try {
            when = new Date(row.at).toLocaleString();
          } catch (e) {
            when = String(row.at);
          }
        }
        return (
          '<li class="border-b border-white/5 py-2.5 last:border-0">' +
          '<p class="text-sm text-white">' +
          escapeHtml(row.text) +
          '</p>' +
          (when
            ? '<p class="text-xs text-discord-muted mt-0.5">' + escapeHtml(when) + '</p>'
            : '') +
          '</li>'
        );
      })
      .join('');
  }

  function renderNowWall(root, pack) {
    if (!root) return;
    const model = buildNowModel(pack);

    const liveEl = root.querySelector('[data-now="live"]');
    const activityEl = root.querySelector('[data-now="activity"]');
    const tracksEl = root.querySelector('[data-now="tracks"]');
    const dealsEl = root.querySelector('[data-now="deals"]');
    const milesEl = root.querySelector('[data-now="milestones"]');
    const noteEl = root.querySelector('[data-now="note"]');

    // Prefer real aggregate cards; optional ranking lists if present
    if (liveEl) renderMetricList(liveEl, model.liveRows);
    if (activityEl) renderMetricList(activityEl, model.activityRows);
    if (tracksEl) renderTrackList(tracksEl, model.topTracks);
    if (dealsEl) renderDealsList(dealsEl, model.recentDeals);
    if (milesEl) renderMilestoneList(milesEl, model.milestones);
    if (noteEl) noteEl.textContent = model.note || '';
  }

  function renderLeaderboards(root, pack) {
    if (!root) return;
    const model = buildNowModel(pack);
    const stats = model.stats || {};
    const pub = model.public || {};
    const S = global.DzbanekStats;

    const setText = function (sel, val) {
      const el = root.querySelector(sel);
      if (el) el.textContent = val;
    };
    if (S) {
      setText('[data-board="total-plays"]', S.formatNum(stats.totalPlays));
      setText('[data-board="wishlist"]', S.formatNum(stats.totalWishlistAdds));
      setText('[data-board="servers"]', S.formatNum(stats.servers));
    }

    const tracksBody = root.querySelector('[data-board="tracks-body"]');
    const serversBody = root.querySelector('[data-board="servers-body"]');

    if (tracksBody) {
      if (!pub.topTracks || !pub.topTracks.length) {
        tracksBody.innerHTML =
          '<tr><td colspan="3" class="px-4 py-6 text-center text-sm text-discord-muted">' +
          t('boards.empty') +
          '</td></tr>';
      } else {
        tracksBody.innerHTML = pub.topTracks
          .map(function (row, i) {
            return (
              '<tr class="border-t border-white/5">' +
              '<td class="px-4 py-3 text-discord-muted">' +
              (i + 1) +
              '</td>' +
              '<td class="px-4 py-3 text-white">' +
              escapeHtml(row.title) +
              '</td>' +
              '<td class="px-4 py-3 text-right font-medium">' +
              escapeHtml(String(row.plays ?? 0)) +
              '</td></tr>'
            );
          })
          .join('');
      }
    }

    if (serversBody) {
      if (!pub.topServers || !pub.topServers.length) {
        serversBody.innerHTML =
          '<tr><td colspan="3" class="px-4 py-6 text-center text-sm text-discord-muted">' +
          t('boards.empty') +
          '</td></tr>';
      } else {
        serversBody.innerHTML = pub.topServers
          .map(function (row, i) {
            return (
              '<tr class="border-t border-white/5">' +
              '<td class="px-4 py-3 text-discord-muted">' +
              (i + 1) +
              '</td>' +
              '<td class="px-4 py-3 text-white">' +
              escapeHtml(row.name) +
              '</td>' +
              '<td class="px-4 py-3 text-right font-medium">' +
              escapeHtml(String(row.plays ?? 0)) +
              '</td></tr>'
            );
          })
          .join('');
      }
    }
  }

  async function loadAndRender(opts) {
    opts = opts || {};
    const S = global.DzbanekStats;
    if (!S) return null;
    try {
      const pack = await S.fetchPublicActivity();
      if (opts.nowRoot) renderNowWall(opts.nowRoot, pack);
      if (opts.boardsRoot) renderLeaderboards(opts.boardsRoot, pack);
      return pack;
    } catch (e) {
      if (opts.nowRoot) {
        renderNowWall(opts.nowRoot, {
          stats: {},
          public: {},
          source: 'error',
        });
      }
      if (opts.boardsRoot) {
        renderLeaderboards(opts.boardsRoot, { stats: {}, public: {}, source: 'error' });
      }
      throw e;
    }
  }

  global.DzbanekPublicFeed = {
    renderNowWall,
    renderLeaderboards,
    loadAndRender,
    buildNowModel,
  };
})(typeof window !== 'undefined' ? window : globalThis);
