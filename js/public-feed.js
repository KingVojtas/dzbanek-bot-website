/**
 * Render public activity (live wall / leaderboards) from DzbanekStats.
 */
(function (global) {
  function t(key, vars) {
    if (global.DZBANEK_I18N && typeof global.DZBANEK_I18N.t === 'function') {
      return global.DZBANEK_I18N.t(key, vars);
    }
    return key;
  }

  function formatPlays(n) {
    return t('now.plays', { n: Number(n) || 0 });
  }

  function renderList(el, items, emptyKey, rowHtml) {
    if (!el) return;
    if (!items || !items.length) {
      el.innerHTML =
        '<p class="text-sm text-discord-muted py-2">' + t(emptyKey || 'now.empty') + '</p>';
      return;
    }
    el.innerHTML = items.map(rowHtml).join('');
  }

  function renderNowWall(root, data) {
    if (!root) return;
    const pub = (data && data.public) || {};
    const tracksEl = root.querySelector('[data-now="tracks"]');
    const dealsEl = root.querySelector('[data-now="deals"]');
    const milesEl = root.querySelector('[data-now="milestones"]');
    const noteEl = root.querySelector('[data-now="note"]');

    renderList(tracksEl, pub.topTracks, 'now.empty', function (row, i) {
      return (
        '<li class="flex items-center justify-between gap-3 border-b border-white/5 py-2.5 last:border-0">' +
        '<span class="min-w-0 truncate text-sm text-white"><span class="text-discord-muted mr-2">' +
        (i + 1) +
        '.</span>' +
        escapeHtml(row.title) +
        '</span>' +
        '<span class="shrink-0 text-xs text-discord-muted">' +
        escapeHtml(formatPlays(row.plays)) +
        '</span></li>'
      );
    });

    renderList(dealsEl, pub.recentDeals, 'now.empty', function (row) {
      const badge =
        row.source === 'epic'
          ? 'Epic'
          : row.source === 'steam'
            ? 'Steam'
            : 'Deal';
      return (
        '<li class="border-b border-white/5 py-2.5 last:border-0">' +
        '<p class="text-xs font-semibold text-discord-blurple">' +
        escapeHtml(badge) +
        '</p>' +
        '<p class="text-sm font-medium text-white">' +
        escapeHtml(row.title) +
        '</p>' +
        (row.subtitle
          ? '<p class="text-xs text-discord-muted mt-0.5">' + escapeHtml(row.subtitle) + '</p>'
          : '') +
        '</li>'
      );
    });

    renderList(milesEl, pub.milestones, 'now.empty', function (row) {
      return (
        '<li class="border-b border-white/5 py-2.5 last:border-0">' +
        '<p class="text-sm text-white">' +
        escapeHtml(row.text) +
        '</p>' +
        (row.at
          ? '<p class="text-xs text-discord-muted mt-0.5">' + escapeHtml(String(row.at)) + '</p>'
          : '') +
        '</li>'
      );
    });

    if (noteEl) {
      noteEl.textContent =
        data && data.source === 'snapshot' ? t('now.sample_note') : '';
    }
  }

  function renderLeaderboards(root, data) {
    if (!root) return;
    const pub = (data && data.public) || {};
    const stats = (data && data.stats) || {};
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

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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
      if (opts.nowRoot) renderNowWall(opts.nowRoot, { public: {}, source: 'error' });
      if (opts.boardsRoot) renderLeaderboards(opts.boardsRoot, { public: {}, stats: {} });
      throw e;
    }
  }

  global.DzbanekPublicFeed = {
    renderNowWall,
    renderLeaderboards,
    loadAndRender,
  };
})(typeof window !== 'undefined' ? window : globalThis);
