/**
 * Shareable stats card — canvas PNG export of live KPIs (1200×630).
 */
(function (global) {
  const W = 1200;
  const H = 630;

  let lastStats = null;
  let avatarImg = null;
  let avatarReady = false;

  function loadAvatar() {
    if (avatarImg) return Promise.resolve(avatarReady);
    return new Promise(function (resolve) {
      avatarImg = new Image();
      avatarImg.onload = function () {
        avatarReady = true;
        resolve(true);
      };
      avatarImg.onerror = function () {
        avatarReady = false;
        resolve(false);
      };
      avatarImg.src = 'assets/bot-avatar.png';
    });
  }

  function setStats(stats) {
    lastStats = stats;
    const downloadBtn = document.getElementById('stats-share-download');
    const copyBtn = document.getElementById('stats-share-copy');
    const enabled = Boolean(stats);
    if (downloadBtn) {
      downloadBtn.disabled = !enabled;
      downloadBtn.classList.toggle('opacity-50', !enabled);
      downloadBtn.classList.toggle('cursor-not-allowed', !enabled);
    }
    if (copyBtn) {
      copyBtn.disabled = !enabled;
      copyBtn.classList.toggle('opacity-50', !enabled);
      copyBtn.classList.toggle('cursor-not-allowed', !enabled);
    }
  }

  function fmt(n) {
    if (global.DzbanekStats && global.DzbanekStats.formatNum) {
      return global.DzbanekStats.formatNum(n);
    }
    if (n == null) return '—';
    return Number(n).toLocaleString();
  }

  function fmtUptime(sec) {
    if (global.DzbanekStats && global.DzbanekStats.formatUptime) {
      return global.DzbanekStats.formatUptime(sec);
    }
    if (sec == null) return '—';
    const s = Math.max(0, Math.floor(Number(sec)));
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    if (d > 0) return d + 'd ' + h + 'h';
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? h + 'h ' + m + 'm' : m + 'm';
  }

  function siteUrl() {
    return (global.DZBANEK && global.DZBANEK.SITE_URL) || 'https://dzbanek-bot.vojtas.io';
  }

  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function drawCard(stats) {
    const canvas = document.getElementById('stats-share-canvas');
    if (!canvas) return null;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Background
    ctx.fillStyle = '#0D0E12';
    ctx.fillRect(0, 0, W, H);

    // Soft blurple glow
    const grad = ctx.createRadialGradient(W * 0.5, 0, 40, W * 0.5, 80, 520);
    grad.addColorStop(0, 'rgba(88, 101, 242, 0.35)');
    grad.addColorStop(1, 'rgba(88, 101, 242, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Card panel
    ctx.fillStyle = '#1E1F22';
    roundRect(ctx, 48, 48, W - 96, H - 96, 28);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 2;
    roundRect(ctx, 48, 48, W - 96, H - 96, 28);
    ctx.stroke();

    // Avatar
    const ax = 88;
    const ay = 88;
    const as = 88;
    if (avatarReady && avatarImg) {
      ctx.save();
      roundRect(ctx, ax, ay, as, as, 22);
      ctx.clip();
      ctx.drawImage(avatarImg, ax, ay, as, as);
      ctx.restore();
      ctx.strokeStyle = 'rgba(88, 101, 242, 0.5)';
      ctx.lineWidth = 3;
      roundRect(ctx, ax, ay, as, as, 22);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#5865F2';
      roundRect(ctx, ax, ay, as, as, 22);
      ctx.fill();
    }

    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 42px Inter, system-ui, sans-serif';
    ctx.fillText('dzbanek-bot', ax + as + 28, ay + 42);
    ctx.fillStyle = '#B5BAC1';
    ctx.font = '500 22px Inter, system-ui, sans-serif';
    ctx.fillText('Live stats', ax + as + 28, ay + 74);

    // Metric cards
    const metrics = [
      { label: 'SERVERS', value: fmt(stats.servers) },
      { label: 'USERS', value: fmt(stats.users) },
      { label: 'UPTIME', value: fmtUptime(stats.uptimeSec) },
    ];
    if (stats.totalPlays != null) {
      metrics.push({ label: 'PLAYS', value: fmt(stats.totalPlays) });
    }

    const count = Math.min(metrics.length, 4);
    const gap = 20;
    const panelX = 88;
    const panelW = W - 176;
    const cardW = (panelW - gap * (count - 1)) / count;
    const cardY = 240;
    const cardH = 180;

    for (let i = 0; i < count; i++) {
      const x = panelX + i * (cardW + gap);
      ctx.fillStyle = '#2B2D31';
      roundRect(ctx, x, cardY, cardW, cardH, 18);
      ctx.fill();
      ctx.strokeStyle = 'rgba(88, 101, 242, 0.25)';
      ctx.lineWidth = 2;
      roundRect(ctx, x, cardY, cardW, cardH, 18);
      ctx.stroke();

      ctx.fillStyle = '#B5BAC1';
      ctx.font = '600 16px Inter, system-ui, sans-serif';
      ctx.fillText(metrics[i].label, x + 24, cardY + 42);

      ctx.fillStyle = '#FFFFFF';
      const val = metrics[i].value;
      let fontSize = 48;
      ctx.font = '800 ' + fontSize + 'px Inter, system-ui, sans-serif';
      while (ctx.measureText(val).width > cardW - 40 && fontSize > 28) {
        fontSize -= 2;
        ctx.font = '800 ' + fontSize + 'px Inter, system-ui, sans-serif';
      }
      ctx.fillText(val, x + 24, cardY + 110);
    }

    // Footer
    ctx.fillStyle = '#B5BAC1';
    ctx.font = '400 16px Inter, system-ui, sans-serif';
    const stamp = new Date().toLocaleString();
    ctx.fillText(siteUrl().replace(/^https?:\/\//, ''), 88, H - 88);
    ctx.fillText(stamp, W - 88 - ctx.measureText(stamp).width, H - 88);

    return canvas;
  }

  function ensureStats() {
    if (!lastStats) {
      global.showToast?.('Load live stats first');
      return false;
    }
    return true;
  }

  async function download() {
    if (!ensureStats()) return;
    await loadAvatar();
    const canvas = drawCard(lastStats);
    if (!canvas) return;
    canvas.toBlob(function (blob) {
      if (!blob) {
        global.showToast?.('Could not create image');
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'dzbanek-bot-stats.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () {
        URL.revokeObjectURL(a.href);
      }, 2000);
      global.showToast?.('Downloaded stats card');
    }, 'image/png');
  }

  async function copyImage() {
    if (!ensureStats()) return;
    await loadAvatar();
    const canvas = drawCard(lastStats);
    if (!canvas) return;

    if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
      global.showToast?.('Copy not supported — use Download');
      return;
    }

    canvas.toBlob(async function (blob) {
      if (!blob) {
        global.showToast?.('Could not create image');
        return;
      }
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        global.showToast?.('Stats card copied');
      } catch {
        global.showToast?.('Copy failed — use Download');
      }
    }, 'image/png');
  }

  function init() {
    const downloadBtn = document.getElementById('stats-share-download');
    const copyBtn = document.getElementById('stats-share-copy');
    if (!downloadBtn && !copyBtn) return;

    setStats(null);
    loadAvatar();

    downloadBtn?.addEventListener('click', function () {
      download();
    });
    copyBtn?.addEventListener('click', function () {
      copyImage();
    });
  }

  global.DzbanekStatsCard = {
    setStats: setStats,
    download: download,
    copyImage: copyImage,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
