/**
 * Dzbanek Now wall + leaderboards — real public stats only.
 */
(function (global) {
  var MILESTONE_KEY = 'dzbanek_seen_milestones';
  var PLAY_THRESHOLDS = [10, 100, 1000, 10000, 50000, 100000];

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

  function fmtNum(n) {
    if (global.DzbanekStats) return global.DzbanekStats.formatNum(n);
    return n == null ? '—' : String(n);
  }

  function fmtDur(sec) {
    if (global.DzbanekStats && global.DzbanekStats.formatDuration) {
      return global.DzbanekStats.formatDuration(sec);
    }
    return null;
  }

  function readSeenMilestones() {
    try {
      var raw = localStorage.getItem(MILESTONE_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function writeSeenMilestones(ids) {
    try {
      localStorage.setItem(MILESTONE_KEY, JSON.stringify(ids.slice(-50)));
    } catch (e) {
      /* ignore */
    }
  }

  function confettiAt(el) {
    if (global.DzbanekShareKit && global.DzbanekShareKit.confettiBurst) {
      global.DzbanekShareKit.confettiBurst(el || document.body);
    }
  }

  function buildThresholdMilestones(stats) {
    var plays = Number(stats.totalPlays);
    if (!Number.isFinite(plays)) return [];
    var out = [];
    PLAY_THRESHOLDS.forEach(function (th) {
      if (plays >= th) {
        out.push({
          id: 'plays-' + th,
          text: t('now.ms_plays_threshold', { n: fmtNum(th) }),
          at: stats.generatedAt || null,
        });
      }
    });
    return out;
  }

  function collectMilestones(stats, pub) {
    var list = [];
    var seen = Object.create(null);
    function add(m) {
      if (!m || !m.id || !m.text || seen[m.id]) return;
      seen[m.id] = true;
      list.push(m);
    }
    if (Array.isArray(pub.milestones)) {
      pub.milestones.forEach(add);
    }
    buildThresholdMilestones(stats).forEach(add);
    return list.slice(0, 8);
  }

  function maybeCelebrate(milestones, cardEl) {
    if (!milestones || !milestones.length) return;
    var seen = readSeenMilestones();
    var seenSet = Object.create(null);
    seen.forEach(function (id) {
      seenSet[id] = true;
    });
    var fresh = milestones.filter(function (m) {
      return m.id && !seenSet[m.id];
    });
    if (!fresh.length) return;
    // First visit: seed without confetti spam
    if (!seen.length) {
      writeSeenMilestones(milestones.map(function (m) {
        return m.id;
      }));
      return;
    }
    confettiAt(cardEl);
    writeSeenMilestones(
      seen.concat(
        fresh.map(function (m) {
          return m.id;
        }),
      ),
    );
  }

  function emptyHtml(msg) {
    return '<p class="text-sm text-discord-muted py-2">' + escapeHtml(msg) + '</p>';
  }

  function renderPlaying(el, notesEl, np) {
    if (!el) return;
    if (!np || !np.title) {
      el.innerHTML =
        '<div class="flex items-center gap-3 text-discord-muted">' +
        '<div class="now-album flex items-center justify-center text-lg opacity-40">♪</div>' +
        '<p class="text-sm">' +
        escapeHtml(t('now.idle_playing')) +
        '</p></div>';
      if (notesEl) notesEl.hidden = true;
      return;
    }
    var art =
      np.albumArtUrl ||
      (global.DZBANEK && global.DZBANEK.OG_IMAGE) ||
      'assets/bot-avatar.png';
    var line =
      escapeHtml(t('now.playing_prefix')) +
      ' <strong class="text-white">' +
      escapeHtml(np.title) +
      '</strong>' +
      (np.artist
        ? ' <span class="text-discord-muted">— ' + escapeHtml(np.artist) + '</span>'
        : '');
    el.innerHTML =
      '<img class="now-album" src="' +
      escapeHtml(art) +
      '" alt="" width="56" height="56" loading="lazy" />' +
      '<div class="min-w-0"><p class="text-sm leading-relaxed">' +
      line +
      '</p></div>';
    if (notesEl) notesEl.hidden = false;
  }

  function renderCommands(el, cmds) {
    if (!el) return;
    if (!cmds || !cmds.length) {
      el.innerHTML = emptyHtml(t('now.empty_commands'));
      return;
    }
    el.innerHTML = cmds
      .map(function (c) {
        var cmd = String(c.command || '');
        if (cmd.length > 48) cmd = cmd.slice(0, 45) + '…';
        return (
          '<li class="border-b border-white/5 py-2 font-mono text-sm text-white/90 last:border-0">' +
          escapeHtml(cmd) +
          '</li>'
        );
      })
      .join('');
  }

  function renderDeals(el, deals) {
    if (!el) return;
    if (!deals || !deals.length) {
      el.innerHTML = emptyHtml(t('now.empty_deals'));
      return;
    }
    el.innerHTML = deals
      .map(function (d) {
        var badge =
          d.source === 'epic' ? 'Epic' : d.source === 'steam' ? 'Steam' : 'Deal';
        var sub = d.subtitle
          ? ' <span class="text-discord-muted">' + escapeHtml(d.subtitle) + '</span>'
          : '';
        return (
          '<li class="border-b border-white/5 py-2.5 text-sm last:border-0">' +
          '<span class="text-xs font-semibold text-discord-blurple">' +
          escapeHtml(t('now.deal_new')) +
          '</span> ' +
          '<span class="text-white">\'' +
          escapeHtml(d.title) +
          '\'</span>' +
          sub +
          ' <span class="text-[10px] uppercase text-discord-muted">(' +
          escapeHtml(badge) +
          ')</span></li>'
        );
      })
      .join('');
  }

  function renderTracks(el, tracks) {
    if (!el) return;
    if (!tracks || !tracks.length) {
      el.innerHTML = emptyHtml(t('now.empty_tracks'));
      return;
    }
    el.innerHTML = tracks
      .slice(0, 3)
      .map(function (row, i) {
        var dur = fmtDur(row.durationSec);
        var meta =
          escapeHtml(t('now.plays', { n: fmtNum(row.plays) })) +
          (dur ? ' · ' + escapeHtml(dur) : '');
        return (
          '<li class="border-b border-white/5 py-2.5 text-sm last:border-0">' +
          '<span class="text-discord-muted">' +
          (i + 1) +
          '. </span>' +
          '<span class="text-white font-medium">' +
          escapeHtml(row.title) +
          '</span>' +
          '<span class="text-discord-muted"> — ' +
          meta +
          '</span></li>'
        );
      })
      .join('');
  }

  function renderMilestones(el, items) {
    if (!el) return;
    if (!items || !items.length) {
      el.innerHTML = emptyHtml(t('now.empty_milestones'));
      return;
    }
    el.innerHTML = items
      .map(function (m) {
        var when = '';
        if (m.at) {
          try {
            when = new Date(m.at).toLocaleString();
          } catch (e) {
            when = String(m.at);
          }
        }
        return (
          '<li class="border-b border-white/5 py-2.5 last:border-0">' +
          '<p class="text-sm text-white">' +
          escapeHtml(m.text) +
          '</p>' +
          (when
            ? '<p class="mt-0.5 text-xs text-discord-muted">' + escapeHtml(when) + '</p>'
            : '') +
          '</li>'
        );
      })
      .join('');
  }

  function renderNowWall(root, pack) {
    if (!root) return;
    var stats = (pack && pack.stats) || {};
    var pub = (pack && pack.public) || {};

    renderPlaying(
      root.querySelector('[data-now="playing"]'),
      root.querySelector('[data-now="notes"]'),
      pub.nowPlaying,
    );
    renderCommands(root.querySelector('[data-now="commands"]'), pub.recentCommands);
    renderDeals(root.querySelector('[data-now="deals"]'), pub.recentDeals);
    renderTracks(root.querySelector('[data-now="tracks"]'), pub.topTracks);

    var milestones = collectMilestones(stats, pub);
    renderMilestones(root.querySelector('[data-now="milestones"]'), milestones);
    maybeCelebrate(milestones, root.querySelector('#now-milestones-card'));

    var noteEl = root.querySelector('[data-now="note"]');
    if (noteEl) {
      var parts = [];
      if (pack && pack.source === 'live') parts.push(t('now.source_live'));
      else if (pack && pack.source === 'snapshot') parts.push(t('now.source_snapshot'));
      if (stats.generatedAt) {
        try {
          parts.push(t('now.updated', { when: new Date(stats.generatedAt).toLocaleString() }));
        } catch (e) {
          /* ignore */
        }
      }
      noteEl.textContent = parts.join(' · ');
    }
  }

  function renderLeaderboards(root, pack) {
    if (!root) return;
    var stats = (pack && pack.stats) || {};
    var pub = (pack && pack.public) || {};
    var S = global.DzbanekStats;
    function setText(sel, val) {
      var el = root.querySelector(sel);
      if (el) el.textContent = val;
    }
    if (S) {
      setText('[data-board="total-plays"]', S.formatNum(stats.totalPlays));
      setText('[data-board="wishlist"]', S.formatNum(stats.totalWishlistAdds));
      setText('[data-board="servers"]', S.formatNum(stats.servers));
    }
    var tracksBody = root.querySelector('[data-board="tracks-body"]');
    var serversBody = root.querySelector('[data-board="servers-body"]');
    if (tracksBody) {
      if (!pub.topTracks || !pub.topTracks.length) {
        tracksBody.innerHTML =
          '<tr><td colspan="3" class="px-4 py-6 text-center text-sm text-discord-muted">' +
          escapeHtml(t('boards.empty')) +
          '</td></tr>';
      } else {
        tracksBody.innerHTML = pub.topTracks
          .map(function (row, i) {
            return (
              '<tr class="border-t border-white/5"><td class="px-4 py-3 text-discord-muted">' +
              (i + 1) +
              '</td><td class="px-4 py-3 text-white">' +
              escapeHtml(row.title) +
              '</td><td class="px-4 py-3 text-right font-medium">' +
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
          escapeHtml(t('boards.empty')) +
          '</td></tr>';
      } else {
        serversBody.innerHTML = pub.topServers
          .map(function (row, i) {
            return (
              '<tr class="border-t border-white/5"><td class="px-4 py-3 text-discord-muted">' +
              (i + 1) +
              '</td><td class="px-4 py-3 text-white">' +
              escapeHtml(row.name) +
              '</td><td class="px-4 py-3 text-right font-medium">' +
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
    var S = global.DzbanekStats;
    if (!S) return null;
    try {
      var pack = await S.fetchPublicActivity();
      if (opts.nowRoot) renderNowWall(opts.nowRoot, pack);
      if (opts.boardsRoot) renderLeaderboards(opts.boardsRoot, pack);
      return pack;
    } catch (e) {
      if (opts.nowRoot) {
        renderNowWall(opts.nowRoot, { stats: {}, public: {}, source: 'error' });
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
  };
})(typeof window !== 'undefined' ? window : globalThis);
