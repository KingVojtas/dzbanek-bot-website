/**
 * Interactive Discord permissions calculator for dzbanek-bot invites.
 * Recommended bitfield with all packs on: 3173376
 */
(function () {
  const PERMS = {
    VIEW_CHANNEL: 1 << 10, // 1024
    SEND_MESSAGES: 1 << 11, // 2048
    MANAGE_MESSAGES: 1 << 13, // 8192
    EMBED_LINKS: 1 << 14, // 16384
    CONNECT: 1 << 20, // 1048576
    SPEAK: 1 << 21, // 2097152
  };

  const CORE_FLAGS = ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'];
  const MUSIC_FLAGS = ['CONNECT', 'SPEAK'];
  const DIGEST_FLAGS = ['MANAGE_MESSAGES'];

  const LABELS = {
    VIEW_CHANNEL: 'View Channel',
    SEND_MESSAGES: 'Send Messages',
    EMBED_LINKS: 'Embed Links',
    MANAGE_MESSAGES: 'Manage Messages',
    CONNECT: 'Connect',
    SPEAK: 'Speak',
  };

  // VIEW_CHANNEL | SEND_MESSAGES | MANAGE_MESSAGES | EMBED_LINKS | CONNECT | SPEAK
  const RECOMMENDED = 3173376;

  function clientId() {
    const fromConfig = window.DZBANEK && window.DZBANEK.INVITE_URL;
    if (fromConfig) {
      try {
        const u = new URL(fromConfig);
        const id = u.searchParams.get('client_id');
        if (id) return id;
      } catch {
        /* ignore */
      }
    }
    return '923262419923513445';
  }

  function buildInvite(bitfield) {
    return (
      'https://discord.com/oauth2/authorize?client_id=' +
      encodeURIComponent(clientId()) +
      '&permissions=' +
      bitfield +
      '&scope=bot%20applications.commands'
    );
  }

  function flagsFromState(music, digest) {
    const flags = CORE_FLAGS.slice();
    if (music) flags.push.apply(flags, MUSIC_FLAGS);
    if (digest) flags.push.apply(flags, DIGEST_FLAGS);
    return flags;
  }

  function bitfieldFromFlags(flags) {
    return flags.reduce((sum, name) => sum + (PERMS[name] || 0), 0);
  }

  function init() {
    const root = document.getElementById('perm-calc');
    if (!root) return;

    const musicEl = document.getElementById('perm-music');
    const digestEl = document.getElementById('perm-digest');
    const bitfieldEl = document.getElementById('perm-bitfield');
    const listEl = document.getElementById('perm-list');
    const urlEl = document.getElementById('perm-url');
    const openBtn = document.getElementById('perm-open');
    const copyBtn = document.getElementById('perm-copy');
    const resetBtn = document.getElementById('perm-reset');
    const inviteCtas = document.querySelectorAll('[data-perm-invite]');

    function update() {
      const music = musicEl ? musicEl.checked : true;
      const digest = digestEl ? digestEl.checked : true;
      const flags = flagsFromState(music, digest);
      const bitfield = bitfieldFromFlags(flags);
      const url = buildInvite(bitfield);

      if (bitfieldEl) bitfieldEl.textContent = String(bitfield);
      if (listEl) {
        listEl.innerHTML = flags
          .map(
            (f) =>
              '<li class="flex items-center gap-2"><span class="h-1.5 w-1.5 rounded-full bg-discord-blurple"></span>' +
              (LABELS[f] || f) +
              '</li>',
          )
          .join('');
      }
      if (urlEl) {
        urlEl.textContent = url;
        urlEl.setAttribute('href', url);
      }
      if (openBtn) openBtn.href = url;
      inviteCtas.forEach((a) => {
        a.setAttribute('href', url);
      });

      root.dataset.bitfield = String(bitfield);
      root.dataset.recommended = bitfield === RECOMMENDED ? '1' : '0';
    }

    musicEl?.addEventListener('change', update);
    digestEl?.addEventListener('change', update);

    copyBtn?.addEventListener('click', () => {
      const url = openBtn?.href || buildInvite(RECOMMENDED);
      if (window.copyText) window.copyText(url);
      else window.showToast?.('Copied invite');
    });

    resetBtn?.addEventListener('click', () => {
      if (musicEl) musicEl.checked = true;
      if (digestEl) digestEl.checked = true;
      update();
      window.showToast?.('Reset to recommended');
    });

    update();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
