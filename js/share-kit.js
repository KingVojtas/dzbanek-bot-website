/**
 * Invite QR + copy helpers. Expects qrcode library global when generating QR
 * (https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js).
 */
(function (global) {
  function inviteUrl() {
    return (global.DZBANEK && global.DZBANEK.INVITE_URL) || '';
  }

  function t(key, vars) {
    if (global.DZBANEK_I18N && global.DZBANEK_I18N.t) {
      return global.DZBANEK_I18N.t(key, vars);
    }
    return key;
  }

  function paintQr(canvas) {
    const url = inviteUrl();
    if (!canvas || !url) return Promise.resolve();
    if (typeof global.QRCode === 'undefined') {
      return Promise.reject(new Error('QRCode library missing'));
    }
    return global.QRCode.toCanvas(canvas, url, {
      width: 200,
      margin: 2,
      color: { dark: '#0D0E12', light: '#ffffff' },
    });
  }

  function downloadQr(canvas, filename) {
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = filename || 'dzbanek-bot-invite-qr.png';
    a.click();
  }

  function bind(root) {
    root = root || document;
    const canvas = root.querySelector('#invite-qr-canvas') || root.querySelector('[data-invite-qr]');
    const copyBtn = root.querySelector('[data-invite-copy]');
    const dlBtn = root.querySelector('[data-invite-download]');

    function refresh() {
      if (!canvas) return;
      paintQr(canvas).catch(function () {
        /* ignore missing lib on non-share pages */
      });
    }

    copyBtn?.addEventListener('click', function () {
      const url = inviteUrl();
      if (global.copyText) global.copyText(url);
      else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () {
          global.showToast?.(t('toast.copied', { text: url }));
        });
      }
    });

    dlBtn?.addEventListener('click', function () {
      if (canvas) downloadQr(canvas);
    });

    refresh();
    document.addEventListener('dzbanek:lang', refresh);
    return { refresh };
  }

  /**
   * Light confetti burst from a point (invite CTAs).
   */
  function confettiBurst(originEl) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = originEl?.getBoundingClientRect?.();
    const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    const colors = ['#5865F2', '#23A559', '#FEE75C', '#EB459E', '#57F287'];
    const layer = document.createElement('div');
    layer.className = 'confetti-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
    for (let i = 0; i < 28; i++) {
      const p = document.createElement('span');
      p.className = 'confetti-piece';
      const angle = (Math.PI * 2 * i) / 28 + Math.random() * 0.4;
      const dist = 60 + Math.random() * 90;
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      p.style.background = colors[i % colors.length];
      p.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      p.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
      p.style.animationDelay = Math.random() * 0.05 + 's';
      layer.appendChild(p);
    }
    setTimeout(function () {
      layer.remove();
    }, 900);
  }

  function bindInviteDelight() {
    document.querySelectorAll('[data-invite-confetti]').forEach(function (el) {
      el.addEventListener('click', function () {
        confettiBurst(el);
      });
    });
  }

  function wireSupportButtons() {
    const url = (global.DZBANEK && global.DZBANEK.SUPPORT_URL) || '';
    document.querySelectorAll('[data-support-cta]').forEach(function (el) {
      if (url) {
        el.setAttribute('href', url);
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
        el.classList.remove('opacity-70', 'cursor-not-allowed');
        el.removeAttribute('aria-disabled');
      } else {
        el.setAttribute('href', '#support');
        el.removeAttribute('target');
        el.addEventListener('click', function (e) {
          e.preventDefault();
          global.showToast?.(t('toast.support_soon'));
        });
      }
    });
  }

  function boot() {
    wireSupportButtons();
    bindInviteDelight();
    if (document.querySelector('#invite-qr-canvas, [data-invite-qr]')) {
      bind(document);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  global.DzbanekShareKit = {
    paintQr,
    downloadQr,
    bind,
    confettiBurst,
    wireSupportButtons,
  };
})(typeof window !== 'undefined' ? window : globalThis);
