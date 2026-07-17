/**
 * Command playground: select a slash command → Discord-style mock embed preview.
 */
(function () {
  const DEMOS = {
    '/play': {
      category: 'music',
      title: 'Now Playing',
      body: 'Lofi beats to code to',
      fields: ['Duration · 3:21', 'Requested by · you', 'Source · YouTube'],
      accent: '#5865F2',
      line: '▶️ Now playing',
    },
    '/queue': {
      category: 'music',
      title: 'Queue · 4 tracks',
      body: '1. Lofi beats to code to  ← now\n2. Midnight City\n3. Blinding Lights\n4. Take On Me',
      fields: ['Loop · off', 'Total · 14:02'],
      accent: '#5865F2',
      line: '📋 Music queue',
    },
    '/playing': {
      category: 'music',
      title: 'Now Playing',
      body: 'Midnight City — M83',
      fields: ['Progress · 1:42 / 4:03'],
      accent: '#5865F2',
      line: '🎧 Currently playing',
    },
    '/skip': {
      category: 'music',
      title: 'Skipped',
      body: 'Skipped to next track',
      fields: ['Next · Blinding Lights'],
      accent: '#5865F2',
      line: '⏭️ Skip',
    },
    '/stop': {
      category: 'music',
      title: 'Stopped',
      body: 'Playback stopped and left the voice channel.',
      fields: [],
      accent: '#ED4245',
      line: '⏹️ Stopped',
    },
    '/pause': {
      category: 'music',
      title: 'Paused',
      body: 'Playback paused. Use /resume to continue.',
      fields: [],
      accent: '#FEE75C',
      line: '⏸️ Paused',
    },
    '/resume': {
      category: 'music',
      title: 'Resumed',
      body: 'Playback resumed.',
      fields: [],
      accent: '#23A559',
      line: '▶️ Resumed',
    },
    '/shuffle': {
      category: 'music',
      title: 'Queue shuffled',
      body: '4 tracks reordered randomly.',
      fields: [],
      accent: '#5865F2',
      line: '🔀 Shuffle',
    },
    '/loop': {
      category: 'music',
      title: 'Loop mode',
      body: 'Loop set to track',
      fields: ['Modes · off · track · queue'],
      accent: '#5865F2',
      line: '🔁 Loop',
    },
    '/remove': {
      category: 'music',
      title: 'Removed',
      body: 'Removed “Take On Me” from the queue.',
      fields: ['Remaining · 3 tracks'],
      accent: '#5865F2',
      line: '🗑️ Remove',
    },
    '/lyrics': {
      category: 'music',
      title: 'Lyrics · Midnight City',
      body: 'Waiting in a car…\nWaiting for a ride in the dark…',
      fields: ['Source · Genius'],
      accent: '#EB459E',
      line: '🎤 Lyrics',
    },
    '/game': {
      category: 'music',
      title: 'Game soundtrack',
      body: 'Queued soundtrack for Hades',
      fields: ['Tracks · 12'],
      accent: '#5865F2',
      line: '🎮 Game OST',
    },
    '/playlist': {
      category: 'music',
      title: 'Dzbanek playlist',
      body: 'Loaded the house playlist into the queue.',
      fields: ['Tracks · 25'],
      accent: '#5865F2',
      line: '📂 Playlist',
    },
    '/wishlist-add': {
      category: 'deals',
      title: 'Wishlist',
      body: 'Added Hades II to your Steam wishlist alerts.',
      fields: ['Store · Steam', 'You’ll get deal digests when it drops.'],
      accent: '#1B2838',
      line: '⭐ Wishlist add',
    },
    '/wishlist-list': {
      category: 'deals',
      title: 'Your wishlist',
      body: '1. Hades II\n2. Baldur’s Gate 3\n3. Celeste',
      fields: ['Tracked · 3 games'],
      accent: '#1B2838',
      line: '📋 Wishlist',
    },
    '/wishlist-remove': {
      category: 'deals',
      title: 'Wishlist',
      body: 'Removed Celeste from wishlist alerts.',
      fields: [],
      accent: '#1B2838',
      line: '🗑️ Wishlist remove',
    },
    '/stats': {
      category: 'stats',
      title: 'Server activity',
      body: 'Plays this week · 128\nUnique listeners · 34',
      fields: ['Skips · 12', 'Top track · Lofi beats'],
      accent: '#23A559',
      line: '📊 Stats',
    },
    '/top': {
      category: 'stats',
      title: 'Top · plays',
      body: '1. you — 42 plays\n2. alice — 31 plays\n3. bob — 18 plays',
      fields: ['Period · 7 days'],
      accent: '#23A559',
      line: '🏆 Top plays',
    },
    '/rank': {
      category: 'leveling',
      title: 'Rank — you',
      body: 'Level 4 · Rank #2\n\n███████░░░  340 / 480 XP to next\nTotal XP: 1,240',
      fields: ['Cooldown · 60s between awards'],
      accent: '#5865F2',
      line: '🏅 Rank',
    },
    '/leaderboard': {
      category: 'leveling',
      title: 'Leaderboard',
      body: '1. alice — Level 12 · 8,400 XP\n2. you — Level 4 · 1,240 XP\n3. bob — Level 3 · 900 XP',
      fields: ['Your rank · #2'],
      accent: '#FEE75C',
      line: '🏆 Top 10 by XP',
    },
    '/setup status': {
      category: 'setup',
      title: 'Feed settings',
      body: 'News · #announcements ✓\nSteam · #deals ✓\nEpic · #free-games ✓',
      fields: ['Manage Server required to change'],
      accent: '#5865F2',
      line: '⚙️ Setup status',
    },
    '/setup news': {
      category: 'setup',
      title: 'News channel set',
      body: 'RSS news will post to #announcements.',
      fields: ['News feed · enabled'],
      accent: '#5865F2',
      line: '⚙️ Setup news',
    },
    '/setup steam': {
      category: 'setup',
      title: 'Steam channel set',
      body: 'Daily Steam digests will post to #deals.',
      fields: ['Steam digest · enabled'],
      accent: '#1B2838',
      line: '⚙️ Setup steam',
    },
    '/setup epic': {
      category: 'setup',
      title: 'Epic channel set',
      body: 'Epic free-game alerts will post to #free-games.',
      fields: ['Epic · enabled'],
      accent: '#0078F2',
      line: '⚙️ Setup epic',
    },
    '/setup disable': {
      category: 'setup',
      title: 'Feeds disabled',
      body: 'Turned off selected digests for this server.',
      fields: [],
      accent: '#ED4245',
      line: '⚙️ Setup disable',
    },
  };

  function fallbackDemo(cmd) {
    return {
      category: 'other',
      title: 'Command',
      body: 'Ran ' + cmd + ' successfully.',
      fields: [],
      accent: '#5865F2',
      line: cmd,
    };
  }

  function timeLabel() {
    return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  function renderEmbed(demo, cmd) {
    const d = demo || fallbackDemo(cmd);
    const fieldsHtml = (d.fields || [])
      .map(function (f) {
        return '<p class="mt-1 text-xs text-[#B5BAC1]">' + escapeHtml(f) + '</p>';
      })
      .join('');
    const bodyHtml = escapeHtml(d.body || '').replace(/\n/g, '<br />');
    return (
      '<div class="flex items-start gap-3">' +
      '<img src="assets/bot-avatar.png" alt="" class="h-10 w-10 shrink-0 rounded-full object-cover" />' +
      '<div class="min-w-0 flex-1">' +
      '<div class="flex flex-wrap items-center gap-1.5">' +
      '<span class="text-sm font-semibold text-white">dzbanek-bot</span>' +
      '<span class="rounded bg-discord-blurple px-1 py-px text-[10px] font-bold uppercase leading-none text-white">Bot</span>' +
      '<span class="text-xs text-[#949BA4]">Today at ' +
      escapeHtml(timeLabel()) +
      '</span>' +
      '</div>' +
      '<p class="mt-1 text-sm text-[#DBDEE1]">' +
      escapeHtml(d.line || cmd) +
      '</p>' +
      '<div class="mt-2 flex overflow-hidden rounded border-l-4 bg-[#2B2D31]" style="border-left-color:' +
      escapeAttr(d.accent || '#5865F2') +
      '">' +
      '<div class="flex-1 p-3">' +
      '<p class="text-xs font-semibold" style="color:' +
      escapeAttr(d.accent || '#5865F2') +
      '">' +
      escapeHtml(d.title || 'Result') +
      '</p>' +
      '<p class="mt-1 text-sm font-semibold text-white">' +
      bodyHtml +
      '</p>' +
      fieldsHtml +
      '</div></div></div></div>'
    );
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

  function init() {
    const root = document.getElementById('cmd-playground');
    if (!root) return;

    const preview = document.getElementById('cmd-playground-preview');
    const label = document.getElementById('cmd-playground-label');
    const chipsHost = document.getElementById('cmd-playground-chips');
    const tabs = root.querySelectorAll('[data-playground-cat]');
    let activeCat = 'all';
    let activeCmd = '/play';

    const allCmds = Object.keys(DEMOS);

    function chipClass(cmd) {
      return 'cmd-chip' + (cmd === activeCmd ? ' is-active' : '');
    }

    function filteredCmds() {
      if (activeCat === 'all') return allCmds;
      return allCmds.filter(function (c) {
        return DEMOS[c].category === activeCat;
      });
    }

    function renderChips() {
      if (!chipsHost) return;
      const list = filteredCmds();
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

    function selectCmd(cmd, copy) {
      if (!cmd) return;
      activeCmd = cmd;
      const demo = DEMOS[cmd] || fallbackDemo(cmd);
      if (preview) {
        preview.innerHTML = renderEmbed(demo, cmd);
        preview.classList.remove('playground-flash');
        // force reflow for animation restart
        void preview.offsetWidth;
        preview.classList.add('playground-flash');
      }
      if (label) label.textContent = cmd;
      renderChips();
      document.querySelectorAll('.cmd-row[data-cmd]').forEach(function (row) {
        row.classList.toggle('is-playground-active', row.getAttribute('data-cmd') === cmd);
      });
      if (copy && window.copyText) window.copyText(cmd);
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        activeCat = tab.getAttribute('data-playground-cat') || 'all';
        tabs.forEach(function (t) {
          const on = t === tab;
          t.classList.toggle('is-active', on);
          t.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        renderChips();
      });
    });

    // Hook existing command rows (after their copy handlers)
    document.querySelectorAll('.cmd-row[data-cmd]').forEach(function (row) {
      row.addEventListener('click', function () {
        selectCmd(row.getAttribute('data-cmd'), false);
      });
      row.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          selectCmd(row.getAttribute('data-cmd'), false);
        }
      });
    });

    renderChips();
    selectCmd(activeCmd, false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
