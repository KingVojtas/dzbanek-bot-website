/**
 * Auto-playing product teaser: Music → Steam → Epic Discord embeds.
 */
(function () {
  var root = document.querySelector('[data-teaser-root]');
  if (!root) return;

  var order = ['music', 'steam', 'epic'];
  var channels = {
    music: 'music',
    steam: 'deals',
    epic: 'free-games',
  };
  var DURATION_MS = 4200;
  var idx = 0;
  var timer = null;
  var started = 0;
  var raf = 0;
  var paused = false;

  var slides = order.map(function (id) {
    return root.querySelector('[data-teaser-slide="' + id + '"]');
  });
  var tabs = order.map(function (id) {
    return root.querySelector('[data-teaser-tab="' + id + '"]');
  });
  var progress = root.querySelector('[data-teaser-progress]');
  var channelEl = root.querySelector('[data-teaser-channel]');

  function reduceMotion() {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      return false;
    }
  }

  function show(i) {
    idx = ((i % order.length) + order.length) % order.length;
    var name = order[idx];
    slides.forEach(function (s, n) {
      if (!s) return;
      var on = n === idx;
      s.classList.toggle('is-active', on);
      s.setAttribute('aria-hidden', on ? 'false' : 'true');
    });
    tabs.forEach(function (t, n) {
      if (!t) return;
      var on = n === idx;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (channelEl) channelEl.textContent = channels[name] || name;
    started = performance.now();
    if (progress) progress.style.width = '0%';
  }

  function tick(now) {
    if (paused || reduceMotion()) return;
    var elapsed = now - started;
    var p = Math.min(1, elapsed / DURATION_MS);
    if (progress) progress.style.width = p * 100 + '%';
    if (p >= 1) {
      show(idx + 1);
    }
    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (reduceMotion()) {
      if (progress) progress.style.width = '100%';
      return;
    }
    cancelAnimationFrame(raf);
    clearInterval(timer);
    started = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    cancelAnimationFrame(raf);
    clearInterval(timer);
  }

  tabs.forEach(function (t, n) {
    if (!t) return;
    t.addEventListener('click', function () {
      show(n);
      start();
    });
  });

  // Pause autoplay when off-screen or tab hidden
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(
      function (entries) {
        var vis = entries.some(function (e) {
          return e.isIntersecting;
        });
        paused = !vis;
        if (vis) {
          started = performance.now() - (parseFloat(progress && progress.style.width) / 100 || 0) * DURATION_MS;
          start();
        } else {
          stop();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(root);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      paused = true;
      stop();
    } else {
      paused = false;
      start();
    }
  });

  show(0);
  start();
})();
