/**
 * Invite QR + copy helpers, support CTAs, invite confetti.
 * Uses local vendor: js/vendor/qrcode.min.js → window.QRCode
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

  function getQRCodeLib() {
    return global.QRCode || global.qrcode || null;
  }

  /**
   * Paint invite URL onto a <canvas>. Retries briefly if the vendor script is still loading.
   */
  function paintQr(canvas, attempt) {
    attempt = attempt || 0;
    const url = inviteUrl();
    if (!canvas || !url) return Promise.resolve(false);

    const lib = getQRCodeLib();
    if (!lib || typeof lib.toCanvas !== 'function') {
      if (attempt < 20) {
        return new Promise(function (resolve) {
          setTimeout(function () {
            paintQr(canvas, attempt + 1).then(resolve);
          }, 50);
        });
      }
      console.warn('[share-kit] QRCode library missing — load js/vendor/qrcode.min.js before share-kit.js');
      showQrFallback(canvas, url);
      return Promise.resolve(false);
    }

    // Fixed pixel size; CSS can scale display size
    const size = 200;
    canvas.width = size;
    canvas.height = size;
    canvas.style.display = '';

    var opts = {
      width: size,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#0D0E12', light: '#ffffff' },
    };

    return new Promise(function (resolve) {
      var settled = false;
      function done(ok) {
        if (settled) return;
        settled = true;
        resolve(ok);
      }
      function fail(err) {
        console.warn('[share-kit] QR render failed', err);
        showQrFallback(canvas, url);
        done(false);
      }
      try {
        var result = lib.toCanvas(canvas, url, opts, function (err) {
          if (err) fail(err);
          else done(true);
        });
        // Promise-style API (no callback used / returns Promise)
        if (result && typeof result.then === 'function') {
          result.then(function () {
            done(true);
          }).catch(fail);
        }
      } catch (e) {
        fail(e);
      }
    });
  }

  /** Last-resort: external QR image API so the box is never blank */
  function showQrFallback(canvas, url) {
    if (!canvas || !canvas.parentNode) return;
    var img = canvas.parentNode.querySelector('[data-invite-qr-img]');
    if (!img) {
      img = document.createElement('img');
      img.setAttribute('data-invite-qr-img', '1');
      img.alt = 'Invite QR code';
      img.width = 200;
      img.height = 200;
      img.className = 'rounded-xl bg-white p-2 shadow-card h-[200px] w-[200px] object-contain';
      canvas.style.display = 'none';
      canvas.parentNode.appendChild(img);
    }
    img.src =
      'https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=' +
      encodeURIComponent(url);
    img.hidden = false;
  }

  function downloadQr(canvas, filename) {
    var img = canvas && canvas.parentNode && canvas.parentNode.querySelector('[data-invite-qr-img]');
    var href = null;
    if (img && img.src && !img.hidden) {
      href = img.src;
    } else if (canvas) {
      try {
        href = canvas.toDataURL('image/png');
      } catch (e) {
        href = null;
      }
    }
    if (!href) {
      global.showToast?.(t('toast.copy_fail'));
      return;
    }
    var a = document.createElement('a');
    a.href = href;
    a.download = filename || 'dzbanek-bot-invite-qr.png';
    a.target = '_blank';
    a.rel = 'noopener';
    a.click();
  }

  function bind(root) {
    root = root || document;
    const canvas = root.querySelector('#invite-qr-canvas') || root.querySelector('[data-invite-qr]');
    const copyBtn = root.querySelector('[data-invite-copy]');
    const dlBtn = root.querySelector('[data-invite-download]');

    function refresh() {
      if (!canvas) return;
      paintQr(canvas);
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
   * @param {Element} [originEl]
   * @param {{ count?: number, spread?: number, durationMs?: number }} [opts]
   */
  function confettiBurst(originEl, opts) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    opts = opts || {};
    const count = opts.count || 28;
    const spread = opts.spread || 90;
    const durationMs = opts.durationMs || 900;
    const rect = originEl?.getBoundingClientRect?.();
    const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    const colors = ['#5865F2', '#23A559', '#FEE75C', '#EB459E', '#57F287', '#ffffff'];
    const layer = document.createElement('div');
    layer.className = 'confetti-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'confetti-piece';
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const dist = 50 + Math.random() * spread;
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      p.style.background = colors[i % colors.length];
      p.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      p.style.setProperty('--dy', Math.sin(angle) * dist - 20 + 'px');
      p.style.animationDelay = Math.random() * 0.08 + 's';
      layer.appendChild(p);
    }
    setTimeout(function () {
      layer.remove();
    }, durationMs);
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
