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

  var EMOJI_CONFETTI = ['🎉', '🎊', '✨', '⭐', '🥳', '🎈', '💫', '🏆', '👏', '🍾'];

  /** Little confetti emojis popping up on the milestones card */
  function emojiConfettiOnCard(cardEl) {
    if (!cardEl) return;
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    } catch (e) {
      /* ignore */
    }
    var layer = document.createElement('div');
    layer.className = 'emoji-confetti-layer';
    layer.setAttribute('aria-hidden', 'true');
    cardEl.appendChild(layer);

    var count = 14;
    for (var i = 0; i < count; i++) {
      var span = document.createElement('span');
      span.className = 'emoji-confetti-piece';
      span.textContent = EMOJI_CONFETTI[i % EMOJI_CONFETTI.length];
      var x = 12 + Math.random() * 76;
      var y = 55 + Math.random() * 35;
      var dx = (Math.random() - 0.5) * 70;
      var dy = -(30 + Math.random() * 70);
      var rot = (Math.random() - 0.5) * 40;
      span.style.setProperty('--ex', x + '%');
      span.style.setProperty('--ey', y + '%');
      span.style.setProperty('--edx', dx + 'px');
      span.style.setProperty('--edy', dy + 'px');
      span.style.setProperty('--erot', rot + 'deg');
      span.style.setProperty('--erot2', rot * -1.4 + 'deg');
      span.style.setProperty('--es', 0.85 + Math.random() * 0.55 + 'rem');
      span.style.setProperty('--ed', 0.9 + Math.random() * 0.5 + 's');
      span.style.setProperty('--edelay', Math.random() * 0.25 + 's');
      layer.appendChild(span);
    }

    setTimeout(function () {
      if (layer.parentNode) layer.parentNode.removeChild(layer);
    }, 1800);
  }

  function confettiAt(el) {
    // Emoji pops on the milestones card
    emojiConfettiOnCard(el);
    // Optional colored bits in the background
    if (global.DzbanekShareKit && global.DzbanekShareKit.confettiBurst) {
      global.DzbanekShareKit.confettiBurst(el || document.body, {
        count: 24,
        spread: 100,
        durationMs: 1000,
      });
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
    if (!milestones || !milestones.length || !cardEl) return;
    var seen = readSeenMilestones();
    var seenSet = Object.create(null);
    seen.forEach(function (id) {
      seenSet[id] = true;
    });
    var fresh = milestones.filter(function (m) {
      return m.id && !seenSet[m.id];
    });

    // Always celebrate brand-new milestone ids once
    if (fresh.length) {
      confettiAt(cardEl);
      writeSeenMilestones(
        seen.concat(
          fresh.map(function (m) {
            return m.id;
          }),
        ),
      );
      return;
    }

    // Re-pop once per browser session when the card is first shown (so the
    // effect is visible on every visit, not only the first lifetime view)
    try {
      if (sessionStorage.getItem('dzbanek_ms_session_pop')) return;
      sessionStorage.setItem('dzbanek_ms_session_pop', '1');
    } catch (e) {
      /* still celebrate below */
    }
    confettiAt(cardEl);
  }

  /** Soft ambient sparkles on the milestones card (always on). */
  function ensureMilestoneFx(cardEl) {
    if (!cardEl || cardEl.querySelector('.ms-sparkle-layer')) return;
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    } catch (e) {
      /* ignore */
    }
    var layer = document.createElement('div');
    layer.className = 'ms-sparkle-layer';
    layer.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < 8; i++) {
      var s = document.createElement('span');
      s.className = 'ms-sparkle';
      s.style.setProperty('--sx', 8 + Math.random() * 84 + '%');
      s.style.setProperty('--sy', 10 + Math.random() * 70 + '%');
      s.style.setProperty('--sd', 2.4 + Math.random() * 2.8 + 's');
      s.style.setProperty('--sdelay', Math.random() * 2.5 + 's');
      layer.appendChild(s);
    }
    cardEl.appendChild(layer);
  }

  function emptyHtml(msg) {
    return '<p class="text-sm text-discord-muted py-2">' + escapeHtml(msg) + '</p>';
  }

  function setPlayingCardState(cardEl, isPlaying) {
    var card =
      cardEl ||
      document.getElementById('now-playing-card') ||
      document.querySelector('[data-now-card="playing"]');
    if (!card) return;
    card.classList.toggle('is-playing', !!isPlaying);
    card.classList.toggle('is-idle', !isPlaying);
    var label = card.querySelector('[data-now="status-label"]');
    if (label) {
      label.textContent = isPlaying ? t('now.live_badge') : t('now.not_playing_badge');
    }
  }

  function renderPlaying(el, notesEl, np, cardEl) {
    if (!el) return;
    var playing = !!(np && String(np.title || '').trim());
    if (!playing) {
      el.innerHTML =
        '<div class="flex items-center gap-3 text-discord-muted">' +
        '<div class="now-album flex items-center justify-center text-lg opacity-40">♪</div>' +
        '<p class="text-sm">' +
        escapeHtml(t('now.idle_playing')) +
        '</p></div>';
      if (notesEl) notesEl.hidden = true;
      setPlayingCardState(cardEl, false);
      return;
    }
    var art =
      np.albumArtUrl ||
      (global.DZBANEK && global.DZBANEK.OG_IMAGE) ||
      'assets/bot-avatar.png';
    var line =
      escapeHtml(t('now.playing_prefix')) +
      ' <strong class="text-theme-strong">' +
      escapeHtml(np.title) +
      '</strong>' +
      (np.artist
        ? ' <span class="text-discord-muted">— ' + escapeHtml(np.artist) + '</span>'
        : '');
    el.innerHTML =
      '<img class="now-album" src="' +
      escapeHtml(art) +
      '" alt="" width="56" height="56" loading="lazy" onerror="this.style.opacity=0.4" />' +
      '<div class="min-w-0"><p class="text-sm leading-relaxed">' +
      line +
      '</p></div>';
    if (notesEl) notesEl.hidden = false;
    setPlayingCardState(cardEl, true);
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
          '<li class="border-b border-white/5 py-2 font-mono text-sm text-theme-strong/90 last:border-0">' +
          escapeHtml(cmd) +
          '</li>'
        );
      })
      .join('');
  }

  function setDealsPulseState(cardEl, hasDeals) {
    if (!cardEl) return;
    cardEl.classList.toggle('is-live', !!hasDeals);
    cardEl.classList.toggle('is-watching', !hasDeals);
    var label = cardEl.querySelector('[data-now="deals-status"]');
    if (label) {
      label.textContent = hasDeals ? t('now.deals_live') : t('now.deals_watching');
    }
  }

  function renderDeals(el, deals, cardEl) {
    if (!el) return;
    var list = Array.isArray(deals) ? deals : [];
    setDealsPulseState(cardEl, list.length > 0);

    if (!list.length) {
      // Always show an alive pipeline pulse — never a dead empty card
      el.innerHTML =
        '<li class="deals-watch-row">' +
        '<span class="deals-pulse-dot" aria-hidden="true"></span>' +
        '<div><p class="text-sm text-theme-strong">' +
        escapeHtml(t('now.deals_watch_steam')) +
        '</p><p class="mt-0.5 text-xs text-discord-muted">' +
        escapeHtml(t('now.deals_watch_steam_sub')) +
        '</p></div></li>' +
        '<li class="deals-watch-row">' +
        '<span class="deals-pulse-dot deals-pulse-dot--epic" aria-hidden="true"></span>' +
        '<div><p class="text-sm text-theme-strong">' +
        escapeHtml(t('now.deals_watch_epic')) +
        '</p><p class="mt-0.5 text-xs text-discord-muted">' +
        escapeHtml(t('now.deals_watch_epic_sub')) +
        '</p></div></li>';
      return;
    }

    el.innerHTML = list
      .map(function (d, i) {
        var badge =
          d.source === 'epic' ? 'Epic' : d.source === 'steam' ? 'Steam' : 'Deal';
        var sub = d.subtitle
          ? ' <span class="text-discord-muted">' + escapeHtml(d.subtitle) + '</span>'
          : '';
        return (
          '<li class="deals-item border-b border-white/5 py-2.5 text-sm last:border-0" style="--di:' +
          i +
          '">' +
          '<span class="deals-pulse-dot' +
          (d.source === 'epic' ? ' deals-pulse-dot--epic' : '') +
          '" aria-hidden="true"></span>' +
          '<div class="min-w-0">' +
          '<span class="text-xs font-semibold text-discord-blurple">' +
          escapeHtml(t('now.deal_new')) +
          '</span> ' +
          '<span class="text-theme-strong">\'' +
          escapeHtml(d.title) +
          '\'</span>' +
          sub +
          ' <span class="text-[10px] uppercase text-discord-muted">(' +
          escapeHtml(badge) +
          ')</span></div></li>'
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
          '<span class="text-theme-strong font-medium">' +
          escapeHtml(row.title) +
          '</span>' +
          '<span class="text-discord-muted"> — ' +
          meta +
          '</span></li>'
        );
      })
      .join('');
  }

  function milestoneIcon(id, text) {
    var s = String(id || '') + ' ' + String(text || '');
    if (/server/i.test(s)) return '🏠';
    if (/play|track|music/i.test(s)) return '🎵';
    if (/user|member/i.test(s)) return '👥';
    if (/wish/i.test(s)) return '💝';
    return '🏆';
  }

  function renderMilestones(el, items) {
    if (!el) return;
    if (!items || !items.length) {
      el.innerHTML = emptyHtml(t('now.empty_milestones'));
      return;
    }
    el.innerHTML = items
      .map(function (m, i) {
        var when = '';
        if (m.at) {
          try {
            when = new Date(m.at).toLocaleString();
          } catch (e) {
            when = String(m.at);
          }
        }
        return (
          '<li class="ms-item" style="--mi:' +
          i +
          '">' +
          '<span class="ms-item-icon" aria-hidden="true">' +
          milestoneIcon(m.id, m.text) +
          '</span>' +
          '<div class="min-w-0">' +
          '<p class="text-sm text-theme-strong">' +
          escapeHtml(m.text) +
          '</p>' +
          (when
            ? '<p class="mt-0.5 text-xs text-discord-muted">' + escapeHtml(when) + '</p>'
            : '') +
          '</div></li>'
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
      root.querySelector('#now-playing-card') ||
        root.querySelector('[data-now-card="playing"]') ||
        root.querySelector('.now-card-live'),
    );
    renderCommands(root.querySelector('[data-now="commands"]'), pub.recentCommands);

    // Merge deals from public block + any alternate keys on raw stats
    var deals = (pub.recentDeals || []).slice();
    if (!deals.length && stats.raw) {
      try {
        var extra = global.DzbanekStats
          ? global.DzbanekStats.normalizePublic(
              stats.raw.public ||
                stats.raw.publicActivity || {
                  recentDeals: stats.raw.recentDeals || stats.raw.deals,
                },
            )
          : null;
        if (extra && extra.recentDeals && extra.recentDeals.length) {
          deals = extra.recentDeals;
        }
      } catch (e) {
        /* ignore */
      }
    }
    var dealsCard =
      root.querySelector('#now-deals-card') ||
      root.querySelector('[data-now-card="deals"]');
    renderDeals(root.querySelector('[data-now="deals"]'), deals, dealsCard);
    renderTracks(root.querySelector('[data-now="tracks"]'), pub.topTracks);

    var milestones = collectMilestones(stats, pub);
    var msCard =
      root.querySelector('#now-milestones-card') ||
      root.querySelector('[data-now-card="milestones"]');
    ensureMilestoneFx(msCard);
    renderMilestones(root.querySelector('[data-now="milestones"]'), milestones);
    maybeCelebrate(milestones, msCard);

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
              '</td><td class="px-4 py-3 text-theme-strong">' +
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
              '</td><td class="px-4 py-3 text-theme-strong">' +
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
