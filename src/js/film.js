/**
 * index.html: the Dzbanek ad in the hero.
 *
 * On the first visit of a session it starts muted, because browsers only allow
 * sound after a click. "Turn on sound" restarts it with the voice-over. When it
 * ends, or is skipped, the stage settles back into the kitchen photo, and the
 * sticker plays it again with sound.
 *
 * The ad's first frame is the hero photo, so the photo seems to start moving.
 * States on .hero[data-film]: idle, starting, playing, paused, done.
 */
(function () {
  const hero = document.querySelector('[data-hero]');
  const video = hero && hero.querySelector('video[data-film]');
  if (!hero || !video) return;

  const SEEN = 'dzbanek_film';
  const LENGTH = 59.400;
  // Where each scene of the ad starts, in seconds.
  const CHAPTERS = [
    { id: 'kitchen', at: 0 },
    { id: 'music', at: 10.15 },
    { id: 'radio', at: 19.445 },
    { id: 'board', at: 33.164 },
    { id: 'deals', at: 41.574 },
    { id: 'welcome', at: 49.778 },
    { id: 'chair', at: 53.424 },
  ];

  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const glow = hero.querySelector('.film-glow');
  const paint = glow && glow.getContext('2d');
  const caption = hero.querySelector('[data-film-caption]');
  const now = hero.querySelector('[data-film-now]');
  const soundButton = hero.querySelector('[data-film-sound]');
  const soundLabel = hero.querySelector('[data-film-sound-label]');
  const sticker = hero.querySelector('[data-film-play]');
  const ring = hero.querySelector('[data-film-ring]');
  const t = (key, fallback) => (window.t && window.t(key)) || fallback;

  let seenBefore = false;
  let captionsOn = false;
  let awayPaused = false;
  let looping = false;
  let lastGlow = 0;
  let lastProgress = 0;
  let resetTimer;

  const state = () => hero.dataset.film;
  const setState = (name) => {
    hero.dataset.film = name;
  };

  /* ---------- chapters ---------- */

  const chapterBox = hero.querySelector('[data-film-chapters]');
  const segments = CHAPTERS.map((chapter, index) => {
    const end = index + 1 < CHAPTERS.length ? CHAPTERS[index + 1].at : LENGTH;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'film-chapter';
    button.style.flexGrow = String(end - chapter.at);
    const fill = document.createElement('span');
    fill.className = 'film-fill';
    button.appendChild(fill);
    button.addEventListener('click', () => {
      video.currentTime = chapter.at;
      if (video.paused) video.play().catch(() => {});
    });
    chapterBox.appendChild(button);
    return { id: chapter.id, at: chapter.at, end, button, fill };
  });

  function progress(time) {
    let current = segments[0];
    segments.forEach((segment) => {
      const share = Math.min(1, Math.max(0, (time - segment.at) / (segment.end - segment.at)));
      segment.fill.style.transform = 'scaleX(' + share.toFixed(4) + ')';
      if (time >= segment.at) current = segment;
    });
    segments.forEach((segment) => {
      if (segment === current) segment.button.setAttribute('aria-current', 'step');
      else segment.button.removeAttribute('aria-current');
    });
    const name = t('film.ch.' + current.id, current.id);
    if (now.textContent !== name) now.textContent = name;
  }

  /* ---------- the frame loop: progress and the ambient glow ---------- */

  function frame(time) {
    if (video.paused || video.ended) {
      looping = false;
      return;
    }
    // The bar crawls a few pixels a second, so ten updates a second look the same as sixty
    // and spare the page a style and paint pass on every frame.
    if (time - lastProgress > 100) {
      progress(video.currentTime);
      lastProgress = time;
    }
    // About eight glow updates a second is plenty for light that soft.
    if (paint && !calm && time - lastGlow > 120) {
      paint.drawImage(video, 0, 0, glow.width, glow.height);
      lastGlow = time;
    }
    next();
  }

  function next() {
    if ('requestVideoFrameCallback' in video) video.requestVideoFrameCallback(frame);
    else requestAnimationFrame(frame);
  }

  /* ---------- captions: shown only with sound, in the page language ---------- */

  const tracks = Array.from(video.textTracks);
  tracks.forEach((track) => {
    track.mode = 'hidden';
    track.addEventListener('cuechange', showCaption);
  });

  function showCaption() {
    const lang = window.currentLang ? window.currentLang() : 'en';
    const track = tracks.find((item) => item.language === lang) || tracks[0];
    const cue = captionsOn && track && track.activeCues && track.activeCues[0];
    caption.textContent = cue ? cue.text : '';
    caption.classList.toggle('is-on', Boolean(cue));
  }

  /* ---------- labels ---------- */

  function labels() {
    hero.dataset.sound = video.muted ? 'off' : 'on';
    soundLabel.textContent = video.muted ? t('film.sound', 'Turn on sound') : t('film.mute', 'Sound off');
    ring.textContent = seenBefore ? t('film.again', 'Watch again · with sound ·') : t('film.watch', 'Watch with sound · 59 s ·');
    sticker.setAttribute(
      'aria-label',
      seenBefore ? t('film.againAria', 'Watch the trailer again with sound') : t('film.watchAria', 'Watch the trailer with sound')
    );
    segments.forEach((segment) => {
      const name = t('film.ch.' + segment.id, segment.id);
      segment.button.setAttribute('aria-label', t('film.chapter', 'Jump to {{name}}').replace('{{name}}', name));
    });
    progress(video.currentTime);
    showCaption();
  }

  /* ---------- playing, finishing ---------- */

  function start(withSound) {
    clearTimeout(resetTimer);
    // The voice-over gets the room to itself: the radio stops.
    if (withSound) document.dispatchEvent(new CustomEvent('dzbanek:film-sound'));
    seenBefore = true;
    captionsOn = withSound;
    video.muted = !withSound;
    if (withSound || video.ended) video.currentTime = 0;
    video.preload = 'auto';
    // Already rolling (sound turned on mid-ad): stay on screen while it rewinds.
    if (video.paused) setState('starting');
    labels();
    return video.play().catch(() => {
      // Refused (low-power mode, a blocked autoplay): the photo hero stays.
      setState('idle');
      labels();
    });
  }

  function finish() {
    const hadFocus = hero.querySelector('.film-bar').contains(document.activeElement);
    setState('done');
    captionsOn = false;
    awayPaused = false;
    video.pause();
    labels();
    if (hadFocus) sticker.focus({ preventScroll: true });
    // Rewind once the film has faded back into the photo.
    resetTimer = setTimeout(() => {
      if (state() !== 'done') return;
      video.currentTime = 0;
      progress(0);
    }, 900);
  }

  video.addEventListener('playing', () => {
    setState('playing');
    if (!looping) {
      looping = true;
      next();
    }
  });

  video.addEventListener('pause', () => {
    if (state() === 'playing' && !video.ended) setState('paused');
  });

  video.addEventListener('seeked', () => progress(video.currentTime));
  video.addEventListener('ended', finish);

  soundButton.addEventListener('click', () => {
    if (video.muted) {
      // The voice-over starts at the top, so the sound restarts the ad.
      start(true);
      return;
    }
    video.muted = true;
    captionsOn = false;
    labels();
  });

  hero.querySelector('[data-film-skip]').addEventListener('click', finish);
  sticker.addEventListener('click', () => start(true));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && (state() === 'playing' || state() === 'paused')) finish();
  });

  // Mostly scrolled away: pause, and pick up again on the way back.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      ([entry]) => {
        const visible = entry.intersectionRatio >= 0.25;
        if (!visible && state() === 'playing') {
          awayPaused = true;
          video.pause();
        } else if (visible && awayPaused && state() === 'paused') {
          awayPaused = false;
          video.play().catch(() => {});
        }
      },
      { threshold: [0, 0.25] }
    ).observe(hero.querySelector('.hero-stage'));
  }

  window.addEventListener('dzbanek:lang', labels);

  // Another video started with sound (the radio ad, radio-film.js): this one goes quiet.
  document.addEventListener('dzbanek:film-sound', (event) => {
    if (!event.detail || !event.detail.source || video.muted) return;
    video.muted = true;
    captionsOn = false;
    labels();
  });

  // And the other way round: when the radio starts, the ad goes quiet.
  document.addEventListener('dzbanek:radio', (event) => {
    if (event.detail.state !== 'tuning' || video.muted) return;
    video.muted = true;
    captionsOn = false;
    labels();
  });

  /* ---------- the first visit of a session plays it, muted ---------- */

  try {
    seenBefore = sessionStorage.getItem(SEEN) === '1';
  } catch (e) {
    /* no storage: treat every visit as the first */
  }
  const saver = Boolean(navigator.connection && navigator.connection.saveData);

  setState('idle');
  labels();
  // From here the hero's own state lays it out.
  document.documentElement.classList.remove('film-soon');

  if (!calm && !saver && !seenBefore) {
    try {
      sessionStorage.setItem(SEEN, '1');
    } catch (e) {
      /* ignore */
    }
    start(false);
    // Autoplay is a preview, so the sticker still offers it with sound afterwards.
    seenBefore = false;
    labels();
  }
})();
