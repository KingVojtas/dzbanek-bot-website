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

  function pipelineRow(settings) {
    if (!settings) {
      return (
        '<p class="mt-2 text-xs text-discord-muted">' +
        escapeHtml(t('check.loading_settings', 'Loading settings…')) +
        '</p>'
      );
    }
    return (
      '<div class="mt-3 flex flex-wrap gap-1.5">' +
      chip(t('check.pipe_music', 'Music'), settings.musicEnabled !== false) +
      chip(t('check.pipe_news', 'News'), !!settings.newsEnabled && !!settings.newsChannelId) +
      chip(t('check.pipe_steam', 'Steam'), !!settings.steamEnabled && !!settings.steamChannelId) +
      chip(t('check.pipe_epic', 'Epic'), !!settings.epicEnabled && !!settings.epicChannelId) +
      chip(
        t('check.pipe_levels', 'Leveling'),
        !!settings.levelingEnabled,
      ) +
      chip(
        t('check.pipe_welcome', 'Welcome'),
        !!settings.welcomeEnabled && !!settings.welcomeChannelId,
      ) +
      '</div>'
    );
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
        if (card) card.innerHTML = pipelineRow(settings);
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
