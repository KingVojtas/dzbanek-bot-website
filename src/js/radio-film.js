/**
 * The radio ad (assets/ad/dzbanek-radio-*.mp4) on the home page's radio section and on radio.html.
 * An ordinary video with controls, under a play sticker until it first plays. Captions follow
 * the page language, and it shares the room with the live radio and the hero ad: whichever
 * starts with sound, the others go quiet.
 */
(function () {
  const films = Array.from(document.querySelectorAll('video[data-radio-film]'));
  if (!films.length) return;

  function captions(video) {
    const lang = window.currentLang ? window.currentLang() : 'en';
    Array.from(video.textTracks).forEach((track) => {
      track.mode = track.language === lang ? 'showing' : 'disabled';
    });
  }

  // The round "Watch with sound" sticker covers the poster until the first play; the browser's
  // own controls come back then. Without scripts the video simply keeps its controls.
  function cover(video) {
    const frame = video.closest('.radio-film-frame');
    const button = frame && frame.querySelector('[data-radio-film-play]');
    if (!button) return;
    video.controls = false;
    button.hidden = false;
    button.addEventListener('click', () => {
      video.controls = true;
      video.play().catch(() => {});
    });
    video.addEventListener('play', () => {
      button.hidden = true;
      video.controls = true;
    });
  }

  films.forEach((video) => {
    captions(video);
    cover(video);
    video.addEventListener('play', () => {
      if (video.muted) return;
      document.dispatchEvent(new CustomEvent('dzbanek:film-sound', { detail: { source: video } }));
    });
    video.addEventListener('volumechange', () => {
      if (!video.paused && !video.muted) {
        document.dispatchEvent(new CustomEvent('dzbanek:film-sound', { detail: { source: video } }));
      }
    });
  });

  // The hero ad or another video found its voice: this one stops.
  document.addEventListener('dzbanek:film-sound', (event) => {
    films.forEach((video) => {
      if (event.detail && event.detail.source === video) return;
      if (!video.paused) video.pause();
    });
  });

  // The live radio started.
  document.addEventListener('dzbanek:radio', (event) => {
    if (event.detail.state !== 'tuning') return;
    films.forEach((video) => video.paused || video.pause());
  });

  window.addEventListener('dzbanek:lang', () => films.forEach(captions));
})();
