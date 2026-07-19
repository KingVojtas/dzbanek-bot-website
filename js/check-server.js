/**
 * "Is the bot in my server?" checker — Discord OAuth + /api/admin/guilds.
 */
(function () {
  var Auth = window.DzbanekAuth;
  if (!Auth) return;

  var t = function (key, vars) {
    if (window.DZBANEK_I18N && typeof window.DZBANEK_I18N.t === 'function') {
      return window.DZBANEK_I18N.t(key, vars);
    }
    return key;
  };

  function $(id) {
    return document.getElementById(id);
  }

  function show(el, on) {
    if (!el) return;
    el.classList.toggle('hidden', !on);
  }

  function chip(label, on) {
    var cls = on
      ? 'rounded-full bg-discord-green/15 px-2.5 py-0.5 text-[11px] font-semibold text-discord-green'
      : 'rounded-full border border-white/10 bg-discord-elevated/50 px-2.5 py-0.5 text-[11px] font-medium text-discord-muted';
    return (
      '<span class="' +
      cls +
      '">' +
      label +
      (on ? ' ✓' : '') +
      '</span>'
    );
  }

  function pipelineFlags(settings) {
    return {
      music: !settings || settings.musicEnabled !== false,
      news: !!(settings && settings.newsEnabled && settings.newsChannelId),
      steam: !!(settings && settings.steamEnabled && settings.steamChannelId),
      epic: !!(settings && settings.epicEnabled && settings.epicChannelId),
      levels: !!(settings && settings.levelingEnabled),
      welcome: !!(settings && settings.welcomeEnabled && settings.welcomeChannelId),
    };
  }

  /** 0–100 setup score from pipeline flags (music always available). */
  function setupScore(flags) {
    var checks = [
      { on: flags.music, w: 20 },
      { on: flags.steam, w: 20 },
      { on: flags.epic, w: 15 },
      { on: flags.news, w: 15 },
      { on: flags.levels, w: 15 },
      { on: flags.welcome, w: 15 },
    ];
    var total = 0;
    var got = 0;
    checks.forEach(function (c) {
      total += c.w;
      if (c.on) got += c.w;
    });
    return Math.round((got / total) * 100);
  }

  function scoreClass(score) {
    if (score >= 80) return 'is-great';
    if (score >= 50) return 'is-ok';
    return 'is-low';
  }

  function scorecardHtml(settings) {
    if (!settings) {
      return (
        '<div class="check-score is-loading" data-scorecard>' +
        '<p class="text-xs text-discord-muted">' +
        escapeHtml(t('check.loading_settings', 'Loading settings…')) +
        '</p></div>'
      );
    }
    var flags = pipelineFlags(settings);
    var score = setupScore(flags);
    var fixes = [];
    if (!flags.steam) {
      fixes.push({
        label: t('check.fix_steam', 'Set Steam channel'),
        href: 'admin.html',
        copy: '/setup steam',
      });
    }
    if (!flags.epic) {
      fixes.push({
        label: t('check.fix_epic', 'Set Epic channel'),
        href: 'admin.html',
        copy: '/setup epic',
      });
    }
    if (!flags.news) {
      fixes.push({
        label: t('check.fix_news', 'Set news channel'),
        href: 'admin.html',
        copy: '/setup news',
      });
    }
    if (!flags.levels) {
      fixes.push({
        label: t('check.fix_levels', 'Enable leveling'),
        href: 'admin.html',
      });
    }
    if (!flags.welcome) {
      fixes.push({
        label: t('check.fix_welcome', 'Enable welcome'),
        href: 'admin.html',
      });
    }
    var fixHtml = '';
    if (fixes.length) {
      fixHtml =
        '<ul class="check-fix-list">' +
        fixes
          .slice(0, 4)
          .map(function (f) {
            var actions =
              '<a href="' +
              escapeHtml(f.href) +
              '" class="check-fix-link">' +
              escapeHtml(t('check.fix_open', 'Fix')) +
              '</a>';
            if (f.copy) {
              actions +=
                ' <button type="button" class="check-fix-copy" data-copy="' +
                escapeHtml(f.copy) +
                '">' +
                escapeHtml(f.copy) +
                '</button>';
            }
            return (
              '<li class="check-fix-item"><span>' +
              escapeHtml(f.label) +
              '</span> ' +
              actions +
              '</li>'
            );
          })
          .join('') +
        '</ul>';
    } else {
      fixHtml =
        '<p class="mt-2 text-xs text-discord-green">' +
        escapeHtml(t('check.score_full', 'Fully set up — nice work.')) +
        '</p>';
    }
    return (
      '<div class="check-score ' +
      scoreClass(score) +
      '" data-scorecard data-score="' +
      score +
      '">' +
      '<div class="check-score-row">' +
      '<div class="check-score-ring" style="--score:' +
      score +
      '" aria-hidden="true">' +
      '<span class="check-score-n">' +
      score +
      '</span></div>' +
      '<div class="min-w-0 flex-1">' +
      '<p class="check-score-label">' +
      escapeHtml(t('check.score_label', 'Setup score')) +
      '</p>' +
      '<p class="check-score-hint">' +
      escapeHtml(
        t('check.score_hint', { n: score }) ||
          score +
            '/100 — music, deals, news, levels & welcome',
      ) +
      '</p>' +
      '<div class="check-score-bar" aria-hidden="true"><span style="width:' +
      score +
      '%"></span></div>' +
      '</div></div>' +
      fixHtml +
      '</div>'
    );
  }

  function pipelineRow(settings) {
    if (!settings) {
      return (
        '<p class="mt-2 text-xs text-discord-muted">' +
        escapeHtml(t('check.loading_settings', 'Loading settings…')) +
        '</p>'
      );
    }
    var flags = pipelineFlags(settings);
    return (
      scorecardHtml(settings) +
      '<div class="mt-3 flex flex-wrap gap-1.5">' +
      chip(t('check.pipe_music', 'Music'), flags.music) +
      chip(t('check.pipe_news', 'News'), flags.news) +
      chip(t('check.pipe_steam', 'Steam'), flags.steam) +
      chip(t('check.pipe_epic', 'Epic'), flags.epic) +
      chip(t('check.pipe_levels', 'Leveling'), flags.levels) +
      chip(t('check.pipe_welcome', 'Welcome'), flags.welcome) +
      '</div>'
    );
  }

  function bindFixCopies(root) {
    if (!root) return;
    root.querySelectorAll('[data-copy]').forEach(function (btn) {
      if (btn._boundCopy) return;
      btn._boundCopy = true;
      btn.addEventListener('click', function () {
        var cmd = btn.getAttribute('data-copy') || '';
        if (window.copyText) window.copyText(cmd);
        else if (navigator.clipboard) navigator.clipboard.writeText(cmd);
        if (window.showToast) window.showToast(t('commands.copied', 'Copied'));
      });
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function guildCard(g, settings) {
    var members =
      g.memberCount != null
        ? escapeHtml(t('check.members', { n: String(g.memberCount) }))
        : '';
    var icon = g.icon
      ? 'https://cdn.discordapp.com/icons/' +
        g.id +
        '/' +
        g.icon +
        '.png?size=64'
      : 'assets/bot-avatar.png';

    return (
      '<article class="rounded-2xl border border-white/5 bg-discord-card p-5 shadow-card" data-guild-id="' +
      escapeHtml(g.id) +
      '">' +
      '<div class="flex items-start gap-3">' +
      '<img src="' +
      escapeHtml(icon) +
      '" alt="" width="40" height="40" class="h-10 w-10 rounded-xl object-cover bg-discord-elevated" loading="lazy" />' +
      '<div class="min-w-0 flex-1">' +
      '<div class="flex flex-wrap items-center gap-2">' +
      '<h3 class="text-base font-semibold text-white truncate">' +
      escapeHtml(g.name || g.id) +
      '</h3>' +
      '<span class="rounded-full bg-discord-green/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-discord-green">' +
      escapeHtml(t('check.bot_present', 'Bot present')) +
      '</span>' +
      '</div>' +
      (members
        ? '<p class="mt-0.5 text-xs text-discord-muted">' + members + '</p>'
        : '') +
      '<div data-pipelines>' +
      pipelineRow(settings) +
      '</div>' +
      '<div class="mt-4 flex flex-wrap gap-2">' +
      '<a href="admin.html" class="rounded-full bg-discord-blurple px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-discord-blurple-hover">' +
      escapeHtml(t('check.open_admin', 'Configure in Admin')) +
      '</a>' +
      '</div>' +
      '</div></div></article>'
    );
  }

  async function loadSettingsFor(guildId) {
    try {
      var res = await Auth.api('/api/admin/guilds/' + guildId + '/settings');
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  async function renderGuilds(guilds) {
    var list = $('check-guilds');
    if (!list) return;
    if (!guilds.length) {
      list.innerHTML = '';
      show($('check-empty'), true);
      return;
    }
    show($('check-empty'), false);
    // First paint cards without settings
    list.innerHTML = guilds.map(function (g) {
      return guildCard(g, null);
    }).join('');

    // Load settings in parallel (cap concurrency lightly)
    await Promise.all(
      guilds.map(async function (g) {
        var settings = await loadSettingsFor(g.id);
        var card = list.querySelector('[data-guild-id="' + g.id + '"] [data-pipelines]');
        if (card) {
          card.innerHTML = pipelineRow(settings);
          bindFixCopies(card);
        }
      }),
    );
  }

  async function initLoggedIn() {
    show($('check-loading'), true);
    show($('check-logged-out'), false);
    show($('check-error'), false);
    show($('check-logged-in'), false);

    try {
      var meRes = await Auth.api('/api/auth/me');
      if (!meRes.ok) {
        show($('check-loading'), false);
        show($('check-logged-out'), true);
        return;
      }
      var me = await meRes.json();
      show($('check-loading'), false);
      show($('check-logged-in'), true);

      var name = me.username || me.globalName || me.id || 'You';
      if ($('check-user-name')) $('check-user-name').textContent = name;
      if ($('check-user-avatar')) {
        if (me.avatar && me.id) {
          $('check-user-avatar').src =
            'https://cdn.discordapp.com/avatars/' + me.id + '/' + me.avatar + '.png?size=64';
        } else {
          $('check-user-avatar').src = 'assets/bot-avatar.png';
        }
      }

      var gRes = await Auth.api('/api/admin/guilds');
      var guilds = gRes.ok ? Auth.normalizeGuilds(await gRes.json()) : [];
      await renderGuilds(guilds);
    } catch (e) {
      show($('check-loading'), false);
      show($('check-error'), true);
      if ($('check-error-detail')) {
        $('check-error-detail').textContent =
          (e && e.message) || t('check.error_generic', 'Could not reach the admin API.');
      }
    }
  }

  function initLoggedOut() {
    show($('check-loading'), false);
    show($('check-logged-in'), false);
    show($('check-error'), false);
    show($('check-logged-out'), true);
    var login = $('check-login');
    if (login) {
      login.href = Auth.loginUrl(
        location.href.split('#')[0].split('?')[0],
      );
    }
  }

  async function init() {
    Auth.captureHandoff();
    var login = $('check-login');
    if (login) {
      login.href = Auth.loginUrl(location.href.split('#')[0].split('?')[0]);
    }

    // Health probe
    try {
      var h = await fetch(Auth.apiBase() + '/api/health', {
        credentials: 'omit',
        cache: 'no-store',
      });
      if (!h.ok) throw new Error('HTTP ' + h.status);
    } catch (e) {
      show($('check-loading'), false);
      show($('check-error'), true);
      if ($('check-error-detail')) {
        $('check-error-detail').textContent = t(
          'check.api_offline',
          'API offline — try again later or open Admin on the bot host.',
        );
      }
      show($('check-logged-out'), true);
      return;
    }

    if (Auth.getSession()) {
      await initLoggedIn();
    } else {
      // Cookie session may still work (same-origin Railway)
      try {
        var meRes = await Auth.api('/api/auth/me');
        if (meRes.ok) {
          await initLoggedIn();
          return;
        }
      } catch (e) {
        /* ignore */
      }
      initLoggedOut();
    }
  }

  $('check-logout')?.addEventListener('click', async function () {
    try {
      await Auth.api('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      /* ignore */
    }
    Auth.setSession('');
    location.href = 'check.html';
  });

  $('check-retry')?.addEventListener('click', function () {
    init();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
