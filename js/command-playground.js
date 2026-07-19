/**
 * Command playground: select a slash command → Discord-style mock embed preview.
 * Category tabs filter chips + catalog; essentials / rows update the preview.
 */
(function () {
  const DEMOS = {
    '/play': {
      category: 'music',
      layout: 'music-player',
      title: 'Lofi beats to code to',
      artist: 'Lofi Girl',
      source: 'YouTube',
      status: 'Now Playing',
      queueLength: 4,
      loopLabel: '🔁 Off',
      pos: '1:42',
      dur: '3:21',
      progressBar: '━━━━━━●─────────',
      accent: '#8b5cf6',
      usage: '/play query: lofi beats',
      opts: [{ name: 'query', value: 'lofi beats' }],
    },
    '/queue': {
      category: 'music',
      title: 'Queue · 4 tracks',
      body: '1. Lofi beats to code to  ← now\n2. Midnight City\n3. Blinding Lights\n4. Take On Me',
      fields: ['Loop · off', 'Total · 14:02'],
      accent: '#8b5cf6',
      line: '📋 Music queue',
      usage: '/queue',
    },
    '/playing': {
      category: 'music',
      layout: 'music-player',
      title: 'Midnight City',
      artist: 'M83',
      source: 'YouTube',
      status: 'Now Playing',
      queueLength: 3,
      loopLabel: '🔁 Off',
      pos: '1:42',
      dur: '4:03',
      progressBar: '━━━━━━●─────────',
      accent: '#8b5cf6',
      usage: '/playing',
    },
    '/skip': {
      category: 'music',
      title: 'Skipped',
      body: 'Skipped to next track',
      fields: ['Next · Blinding Lights'],
      accent: '#5865F2',
      line: '⏭️ Skip',
      usage: '/skip',
    },
    '/stop': {
      category: 'music',
      title: 'Stopped',
      body: 'Playback stopped and left the voice channel.',
      fields: [],
      accent: '#ED4245',
      line: '⏹️ Stopped',
      usage: '/stop',
    },
    '/pause': {
      category: 'music',
      title: 'Paused',
      body: 'Playback paused. Use /resume to continue.',
      fields: [],
      accent: '#FEE75C',
      line: '⏸️ Paused',
      usage: '/pause',
    },
    '/resume': {
      category: 'music',
      title: 'Resumed',
      body: 'Playback resumed.',
      fields: [],
      accent: '#23A559',
      line: '▶️ Resumed',
      usage: '/resume',
    },
    '/shuffle': {
      category: 'music',
      title: 'Queue shuffled',
      body: '4 tracks reordered randomly.',
      fields: [],
      accent: '#5865F2',
      line: '🔀 Shuffle',
      usage: '/shuffle',
    },
    '/loop': {
      category: 'music',
      title: 'Loop mode',
      body: 'Loop set to track',
      fields: ['Modes · off · track · queue'],
      accent: '#5865F2',
      line: '🔁 Loop',
      usage: '/loop mode: track',
      opts: [{ name: 'mode', value: 'track' }],
    },
    '/remove': {
      category: 'music',
      title: 'Removed',
      body: 'Removed “Take On Me” from the queue.',
      fields: ['Remaining · 3 tracks'],
      accent: '#5865F2',
      line: '🗑️ Remove',
      usage: '/remove position: 4',
      opts: [{ name: 'position', value: '4' }],
    },
    '/lyrics': {
      category: 'music',
      title: 'Lyrics · Midnight City',
      body: 'Waiting in a car…\nWaiting for a ride in the dark…',
      fields: ['Source · Genius'],
      accent: '#EB459E',
      line: '🎤 Lyrics',
      usage: '/lyrics',
    },
    '/game': {
      category: 'music',
      title: 'Game soundtrack',
      body: 'Queued soundtrack for Hades',
      fields: ['Tracks · 12'],
      accent: '#5865F2',
      line: '🎮 Game OST',
      usage: '/game name: Hades',
      opts: [{ name: 'name', value: 'Hades' }],
    },
    '/playlist': {
      category: 'music',
      title: 'Dzbanek playlist',
      body: 'Loaded the house playlist into the queue.',
      fields: ['Tracks · 25'],
      accent: '#5865F2',
      line: '📂 Playlist',
      usage: '/playlist',
    },
    '/wishlist-add': {
      category: 'deals',
      title: 'Wishlist',
      body: 'Added Hades II to your Steam wishlist alerts.',
      fields: ['Store · Steam', 'You’ll get deal digests when it drops.'],
      accent: '#66C0F4',
      line: '⭐ Wishlist add',
      usage: '/wishlist-add game: Hades II',
      opts: [{ name: 'game', value: 'Hades II' }],
    },
    '/wishlist-list': {
      category: 'deals',
      title: 'Your wishlist',
      body: '1. Hades II\n2. Baldur’s Gate 3\n3. Celeste',
      fields: ['Tracked · 3 games'],
      accent: '#66C0F4',
      line: '📋 Wishlist',
      usage: '/wishlist-list',
    },
    '/wishlist-remove': {
      category: 'deals',
      title: 'Wishlist',
      body: 'Removed Celeste from wishlist alerts.',
      fields: [],
      accent: '#66C0F4',
      line: '🗑️ Wishlist remove',
      usage: '/wishlist-remove name: Celeste',
      opts: [{ name: 'name', value: 'Celeste' }],
    },
    '/stats': {
      category: 'stats',
      title: 'Server activity',
      body: 'Plays this week · 128\nUnique listeners · 34',
      fields: ['Skips · 12', 'Top track · Lofi beats'],
      accent: '#23A559',
      line: '📊 Stats',
      usage: '/stats',
    },
    '/top': {
      category: 'stats',
      title: 'Top · plays',
      body: '1. you — 42 plays\n2. alice — 31 plays\n3. bob — 18 plays',
      fields: ['Period · 7 days'],
      accent: '#23A559',
      line: '🏆 Top plays',
      usage: '/top metric: plays',
      opts: [{ name: 'metric', value: 'plays' }],
    },
    '/rank': {
      category: 'leveling',
      title: 'Rank — you',
      body: 'Level 4 · Rank #2\n\n███████░░░  340 / 480 XP to next\nTotal XP: 1,240',
      fields: ['Cooldown · 60s between awards'],
      accent: '#5865F2',
      line: '🏅 Rank',
      usage: '/rank',
      progress: 0.71,
    },
    '/leaderboard': {
      category: 'leveling',
      title: 'Leaderboard',
      body: '1. alice — Level 12 · 8,400 XP\n2. you — Level 4 · 1,240 XP\n3. bob — Level 3 · 900 XP',
      fields: ['Your rank · #2'],
      accent: '#FEE75C',
      line: '🏆 Top 10 by XP',
      usage: '/leaderboard',
    },
    '/setup status': {
      category: 'setup',
      title: 'Feed settings',
      body: 'News · #announcements ✓\nSteam · #deals ✓\nEpic · #free-games ✓',
      fields: ['Manage Server required to change'],
      accent: '#5865F2',
      line: '⚙️ Setup status',
      usage: '/setup status',
    },
    '/setup news': {
      category: 'setup',
      title: 'News channel set',
      body: 'RSS news will post to #announcements.',
      fields: ['News feed · enabled'],
      accent: '#5865F2',
      line: '⚙️ Setup news',
      usage: '/setup news channel: #announcements',
      opts: [{ name: 'channel', value: '#announcements' }],
    },
    '/setup steam': {
      category: 'setup',
      title: 'Steam channel set',
      body: 'Daily Steam digests will post to #deals.',
      fields: ['Steam digest · enabled'],
      accent: '#66C0F4',
      line: '⚙️ Setup steam',
      usage: '/setup steam channel: #deals',
      opts: [{ name: 'channel', value: '#deals' }],
    },
    '/setup epic': {
      category: 'setup',
      title: 'Epic channel set',
      body: 'Epic free-game alerts will post to #free-games.',
      fields: ['Epic · enabled'],
      accent: '#0078F2',
      line: '⚙️ Setup epic',
      usage: '/setup epic channel: #free-games',
      opts: [{ name: 'channel', value: '#free-games' }],
    },
    '/setup disable': {
      category: 'setup',
      title: 'Feeds disabled',
      body: 'Turned off selected digests for this server.',
      fields: [],
      accent: '#ED4245',
      line: '⚙️ Setup disable',
      usage: '/setup disable what: all',
      opts: [{ name: 'what', value: 'all' }],
    },
  };

  function t(key, fallback) {
    try {
      if (window.DZBANEK_I18N && typeof window.DZBANEK_I18N.t === 'function') {
        const v = window.DZBANEK_I18N.t(key);
        if (v && v !== key) return v;
      }
    } catch (_) {
      /* ignore */
    }
    return fallback;
  }

  function fallbackDemo(cmd) {
    return {
      category: 'other',
      title: 'Command',
      body: 'Ran ' + cmd + ' successfully.',
      fields: [],
      accent: '#5865F2',
      line: cmd,
      usage: cmd,
    };
  }

  function timeLabel() {
    return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, '&#39;');
  }

  function renderOpts(opts) {
    if (!opts || !opts.length) return '';
    return opts
      .map(function (o) {
        return (
          '<span class="cmd-slash-opt">' +
          escapeHtml(o.name) +
          ': <em>' +
          escapeHtml(o.value) +
          '</em></span>'
        );
      })
      .join('');
  }

  function renderUserSlash(cmd, d) {
    const usedLabel = t('commands.used', 'used');
    const youLabel = t('commands.you', 'You');
    return (
      '<div class="cmd-slash-msg">' +
      '<span class="cmd-user-avatar" aria-hidden="true">YOU</span>' +
      '<div class="min-w-0 flex-1">' +
      '<div class="flex flex-wrap items-center gap-1.5">' +
      '<span class="cmd-discord-name">' +
      escapeHtml(youLabel) +
      '</span>' +
      '<span class="text-xs text-[#949BA4]">Today at ' +
      escapeHtml(timeLabel()) +
      '</span>' +
      '</div>' +
      '<p class="mt-0.5 text-xs text-[#949BA4]">' +
      escapeHtml(usedLabel) +
      '</p>' +
      '<div class="cmd-slash-pill">' +
      '<code>' +
      escapeHtml(cmd) +
      '</code>' +
      renderOpts(d.opts) +
      '</div>' +
      '</div></div>'
    );
  }

  function renderBotHeader() {
    return (
      '<div class="flex flex-wrap items-center gap-1.5">' +
      '<span class="cmd-discord-name">dzbanek-bot</span>' +
      '<span class="cmd-discord-bot">BOT</span>' +
      '<span class="text-xs text-[#949BA4]">Today at ' +
      escapeHtml(timeLabel()) +
      '</span>' +
      '</div>'
    );
  }

  /** Matches buildMusicPlayerDisplay (Components V2). */
  function renderMusicPlayer(d) {
    const accent = d.accent || '#8b5cf6';
    const q = d.queueLength != null ? d.queueLength : 4;
    return (
      '<div class="cmd-bot-msg">' +
      '<img src="assets/bot-avatar.png" alt="" class="cmd-discord-avatar" width="40" height="40" />' +
      '<div class="min-w-0 flex-1">' +
      renderBotHeader() +
      '<div class="dc-v2 dc-v2--music" style="border-left-color:' +
      escapeAttr(accent) +
      '">' +
      '<div class="dc-v2-section">' +
      '<div class="dc-v2-text">' +
      '<p class="dc-v2-kicker"><strong>Music Player</strong> · ' +
      escapeHtml(d.source || 'YouTube') +
      '</p>' +
      '<p class="dc-v2-title">' +
      escapeHtml(d.title || 'Track') +
      '</p>' +
      (d.artist
        ? '<p class="dc-v2-artist">' + escapeHtml(d.artist) + '</p>'
        : '') +
      '<div class="dc-v2-progress" aria-hidden="true">' +
      escapeHtml(d.progressBar || '━━━━━━●─────────') +
      '</div>' +
      '<p class="dc-v2-times"><code>' +
      escapeHtml(d.pos || '0:00') +
      '</code> &nbsp;/&nbsp; <code>' +
      escapeHtml(d.dur || '0:00') +
      '</code></p>' +
      '<p class="dc-v2-status"><strong>' +
      escapeHtml(d.status || 'Now Playing') +
      '</strong> · Queue: <strong>' +
      escapeHtml(String(q)) +
      '</strong> track' +
      (q === 1 ? '' : 's') +
      ' · ' +
      escapeHtml(d.loopLabel || '🔁 Off') +
      '</p>' +
      '</div>' +
      '<div class="dc-v2-thumb" aria-hidden="true">🎵</div>' +
      '</div>' +
      '<div class="dc-v2-sep" aria-hidden="true"></div>' +
      '<div class="dc-v2-actions" aria-hidden="true">' +
      '<span class="dc-v2-btn dc-v2-btn--primary">⏸️ Pause</span>' +
      '<span class="dc-v2-btn">⏭️ Skip</span>' +
      '<span class="dc-v2-btn dc-v2-btn--danger">⏹️ Stop</span>' +
      '<span class="dc-v2-btn">🔁 Loop</span>' +
      '<span class="dc-v2-btn">🔀 Shuffle</span>' +
      '</div></div></div></div>'
    );
  }

  function renderEmbed(demo, cmd) {
    const d = demo || fallbackDemo(cmd);
    if (d.layout === 'music-player') {
      return renderUserSlash(cmd, d) + renderMusicPlayer(d);
    }

    const fieldsHtml = (d.fields || [])
      .map(function (f) {
        return '<p class="cmd-embed-field">' + escapeHtml(f) + '</p>';
      })
      .join('');
    const bodyHtml = escapeHtml(d.body || '').replace(/\n/g, '<br />');
    const progress =
      typeof d.progress === 'number'
        ? '<div class="cmd-progress" aria-hidden="true"><span style="width:' +
          Math.round(Math.max(0, Math.min(1, d.progress)) * 100) +
          '%"></span></div>'
        : '';

    return (
      renderUserSlash(cmd, d) +
      '<div class="cmd-bot-msg">' +
      '<img src="assets/bot-avatar.png" alt="" class="cmd-discord-avatar" width="40" height="40" />' +
      '<div class="min-w-0 flex-1">' +
      renderBotHeader() +
      (d.line
        ? '<p class="mt-1 text-sm text-[#DBDEE1]">' + escapeHtml(d.line) + '</p>'
        : '') +
      '<div class="cmd-embed" style="border-left-color:' +
      escapeAttr(d.accent || '#5865F2') +
      '">' +
      '<div class="cmd-embed-inner">' +
      '<p class="cmd-embed-title" style="color:' +
      escapeAttr(d.accent || '#5865F2') +
      '">' +
      escapeHtml(d.title || 'Result') +
      '</p>' +
      '<p class="cmd-embed-body">' +
      bodyHtml +
      '</p>' +
      progress +
      fieldsHtml +
      '</div></div></div></div>'
    );
  }

  function init() {
    const root = document.getElementById('cmd-playground');
    if (!root) return;

    const preview = document.getElementById('cmd-playground-preview');
    const label = document.getElementById('cmd-playground-label');
    const chipsHost = document.getElementById('cmd-playground-chips');
    const usageEl = document.getElementById('cmd-playground-usage');
    const copyActiveBtn = document.getElementById('cmd-copy-active');
    const copyExampleBtn = document.getElementById('cmd-copy-example');
    const trendingHost = document.getElementById('cmd-trending');
    const trendingChips = document.getElementById('cmd-trending-chips');
    const catTabs = document.querySelectorAll('[data-cmd-cat]');
    const searchInput = document.getElementById('cmd-search');
    const searchClear = document.getElementById('cmd-search-clear');
    const filterCount = document.getElementById('cmd-filter-count');
    let activeCat = 'all';
    let activeCmd = '/play';
    let searchQ = '';
    let copyBurstDone = false;

    function flashCopyBtn(btn, ms) {
      if (!btn) return;
      const prev = btn.textContent;
      btn.textContent = t('commands.copied', 'Copied');
      btn.classList.add('is-copied');
      window.setTimeout(function () {
        btn.textContent = prev;
        btn.classList.remove('is-copied');
      }, ms || 900);
    }

    function confettiOnce(originEl) {
      if (copyBurstDone) return;
      copyBurstDone = true;
      try {
        if (
          window.DzbanekShareKit &&
          typeof window.DzbanekShareKit.confettiBurst === 'function'
        ) {
          window.DzbanekShareKit.confettiBurst(originEl || copyActiveBtn, {
            count: 22,
            spread: 70,
          });
          return;
        }
      } catch (e) {
        /* ignore */
      }
    }

    function exampleFor(cmd) {
      const demo = DEMOS[cmd] || fallbackDemo(cmd);
      return demo.usage || cmd;
    }

    function copyCmd(cmd, fullExample, originEl) {
      const text = fullExample ? exampleFor(cmd) : cmd;
      if (window.copyText) window.copyText(text);
      confettiOnce(originEl);
      return text;
    }

    const allCmds = Object.keys(DEMOS);

    function chipClass(cmd) {
      return 'cmd-chip' + (cmd === activeCmd ? ' is-active' : '');
    }

    function filteredCmds() {
      let list = activeCat === 'all' ? allCmds.slice() : allCmds.filter(function (c) {
        return DEMOS[c].category === activeCat;
      });
      if (searchQ) {
        list = list.filter(function (c) {
          const demo = DEMOS[c] || {};
          const hay = (
            c +
            ' ' +
            (demo.title || '') +
            ' ' +
            (demo.line || '') +
            ' ' +
            (demo.usage || '') +
            ' ' +
            (demo.category || '')
          ).toLowerCase();
          return hay.indexOf(searchQ) !== -1;
        });
      }
      return list;
    }

    function updateFilterChrome(count) {
      if (filterCount) {
        if (!searchQ) {
          filterCount.hidden = true;
        } else {
          filterCount.hidden = false;
          const key =
            count === 1 ? 'commands.filter_count' : 'commands.filter_count_plural';
          try {
            if (window.DZBANEK_I18N && typeof window.DZBANEK_I18N.t === 'function') {
              const label = window.DZBANEK_I18N.t(key, { n: count });
              if (label && label !== key) {
                filterCount.textContent = label;
              } else {
                filterCount.textContent = count + (count === 1 ? ' match' : ' matches');
              }
            } else {
              filterCount.textContent = count + (count === 1 ? ' match' : ' matches');
            }
          } catch (_) {
            filterCount.textContent = String(count);
          }
        }
      }
      if (searchClear) searchClear.hidden = !searchQ;
    }

    function renderChips() {
      if (!chipsHost) return;
      const list = filteredCmds();
      updateFilterChrome(list.length);
      if (!list.length) {
        chipsHost.innerHTML =
          '<p class="text-sm text-discord-muted m-0">' +
          escapeHtml(t('commands.empty', 'No commands match your search.')) +
          '</p>';
        return;
      }
      chipsHost.innerHTML = list
        .map(function (cmd) {
          return (
            '<button type="button" class="' +
            chipClass(cmd) +
            '" data-playground-cmd="' +
            escapeAttr(cmd) +
            '" role="listitem">' +
            escapeHtml(cmd) +
            '</button>'
          );
        })
        .join('');
      chipsHost.querySelectorAll('[data-playground-cmd]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          selectCmd(btn.getAttribute('data-playground-cmd'), true);
        });
      });
    }

    function applySearch() {
      searchQ = (searchInput && searchInput.value ? searchInput.value : '').trim().toLowerCase();
      renderChips();
      const list = filteredCmds();
      if (list.length && list.indexOf(activeCmd) === -1) {
        selectCmd(list[0], false);
      }
    }

    function refreshPreview() {
      const demo = DEMOS[activeCmd] || fallbackDemo(activeCmd);
      if (preview) {
        preview.innerHTML = renderEmbed(demo, activeCmd);
      }
      if (label) label.textContent = activeCmd;
      if (usageEl) {
        if (demo.usage) {
          usageEl.hidden = false;
          usageEl.innerHTML =
            '<strong>' +
            escapeHtml(t('commands.example', 'Example')) +
            '</strong> ' +
            escapeHtml(demo.usage);
        } else {
          usageEl.hidden = true;
          usageEl.textContent = '';
        }
      }
    }

    function setCategory(cat, opts) {
      opts = opts || {};
      activeCat = cat || 'all';
      catTabs.forEach(function (tab) {
        const on = (tab.getAttribute('data-cmd-cat') || '') === activeCat;
        tab.classList.toggle('is-active', on);
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      renderChips();
      if (opts.ensureActiveVisible) {
        const list = filteredCmds();
        if (list.length && list.indexOf(activeCmd) === -1) {
          selectCmd(list[0], false);
        }
      }
    }

    function selectCmd(cmd, copy) {
      if (!cmd) return;
      activeCmd = cmd;
      const demo = DEMOS[cmd] || fallbackDemo(cmd);
      if (preview) {
        preview.innerHTML = renderEmbed(demo, cmd);
        preview.classList.remove('playground-flash');
        void preview.offsetWidth;
        preview.classList.add('playground-flash');
      }
      if (label) label.textContent = cmd;
      if (usageEl) {
        if (demo.usage) {
          usageEl.hidden = false;
          usageEl.innerHTML =
            '<strong>' +
            escapeHtml(t('commands.example', 'Example')) +
            '</strong> ' +
            escapeHtml(demo.usage);
        } else {
          usageEl.hidden = true;
          usageEl.textContent = '';
        }
      }
      renderChips();
      document.querySelectorAll('[data-cmd-pick]').forEach(function (btn) {
        btn.classList.toggle('is-active', btn.getAttribute('data-cmd-pick') === cmd);
      });
      if (copy) copyCmd(cmd, true, copyExampleBtn || copyActiveBtn);
      if (copyExampleBtn) {
        const ex = exampleFor(cmd);
        copyExampleBtn.hidden = !ex || ex === cmd;
        copyExampleBtn.setAttribute('title', ex);
      }
    }

    catTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        setCategory(tab.getAttribute('data-cmd-cat') || 'all', { ensureActiveVisible: true });
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', applySearch);
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          searchInput.value = '';
          applySearch();
          searchInput.blur();
        }
      });
    }
    if (searchClear) {
      searchClear.addEventListener('click', function () {
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
        applySearch();
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (document.activeElement && document.activeElement.tagName
        ? document.activeElement.tagName
        : ''
      ).toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (document.activeElement && document.activeElement.isContentEditable))
        return;
      if (!searchInput) return;
      e.preventDefault();
      const sec = document.getElementById('commands');
      if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      searchInput.focus();
      if (searchInput.select) searchInput.select();
    });

    document.querySelectorAll('[data-cmd-pick]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const cmd = btn.getAttribute('data-cmd-pick');
        const demo = DEMOS[cmd];
        if (demo && activeCat !== 'all' && demo.category !== activeCat) {
          setCategory(demo.category, { ensureActiveVisible: false });
        }
        selectCmd(cmd, true);
        root.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });

    if (copyActiveBtn) {
      copyActiveBtn.addEventListener('click', function () {
        copyCmd(activeCmd, false, copyActiveBtn);
        flashCopyBtn(copyActiveBtn);
      });
    }
    if (copyExampleBtn) {
      copyExampleBtn.addEventListener('click', function () {
        copyCmd(activeCmd, true, copyExampleBtn);
        flashCopyBtn(copyExampleBtn);
      });
    }

    function renderTrending(commands) {
      if (!trendingHost || !trendingChips) return;
      const list = [];
      const seen = Object.create(null);
      (commands || []).forEach(function (c) {
        let cmd = String((c && c.command) || c || '')
          .trim()
          .split(/\s+/)[0];
        if (!cmd) return;
        if (!cmd.startsWith('/')) cmd = '/' + cmd;
        // normalize to known demos when possible
        let key = cmd;
        if (!DEMOS[key]) {
          // try matching "/setup" family
          const hit = allCmds.find(function (k) {
            return k === cmd || k.startsWith(cmd + ' ') || cmd.startsWith(k);
          });
          if (hit) key = hit;
        }
        if (!DEMOS[key] || seen[key]) return;
        seen[key] = true;
        list.push(key);
      });
      if (!list.length) {
        trendingHost.hidden = true;
        trendingChips.innerHTML = '';
        return;
      }
      trendingHost.hidden = false;
      trendingChips.innerHTML = list
        .slice(0, 6)
        .map(function (cmd) {
          return (
            '<button type="button" class="cmd-chip" data-trend-cmd="' +
            escapeAttr(cmd) +
            '" role="listitem">' +
            escapeHtml(cmd) +
            '</button>'
          );
        })
        .join('');
      trendingChips.querySelectorAll('[data-trend-cmd]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const cmd = btn.getAttribute('data-trend-cmd');
          const demo = DEMOS[cmd];
          if (demo && activeCat !== 'all' && demo.category !== activeCat) {
            setCategory(demo.category, { ensureActiveVisible: false });
          }
          selectCmd(cmd, true);
        });
      });
    }

    // Public API for search filter + deep-links
    window.DzbanekCmdPlayground = {
      select: function (cmd, copy) {
        selectCmd(cmd, !!copy);
      },
      setCategory: setCategory,
      getCategory: function () {
        return activeCat;
      },
      getActive: function () {
        return activeCmd;
      },
      demos: DEMOS,
      applySearch: applySearch,
      setTrending: renderTrending,
    };

    document.addEventListener('dzbanek:lang', function () {
      refreshPreview();
      renderChips();
      if (copyActiveBtn && !copyActiveBtn.classList.contains('is-copied')) {
        copyActiveBtn.textContent = t('commands.copy_short', 'Copy');
      }
    });

    renderChips();
    selectCmd(activeCmd, false);

    // Deep-link: #commands=/play or ?cmd=/rank
    try {
      const params = new URLSearchParams(window.location.search);
      let deep = params.get('cmd');
      if (!deep && window.location.hash.indexOf('commands=') === 1) {
        deep = decodeURIComponent(window.location.hash.slice('commands='.length + 1));
      } else if (!deep && window.location.hash.indexOf('#cmd=') === 0) {
        deep = decodeURIComponent(window.location.hash.slice(5));
      }
      if (deep) {
        if (!deep.startsWith('/')) deep = '/' + deep;
        if (DEMOS[deep]) selectCmd(deep, false);
      }
    } catch (_) {
      /* ignore */
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
