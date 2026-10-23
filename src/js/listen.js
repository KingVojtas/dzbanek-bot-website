/**
 * The three stations, live in the browser: the same streams the bot plays in Discord
 * (src/radio/station.ts in the bot). One player for the whole page, and nothing plays
 * until someone presses a key. Song info comes from radia.cz, where the bot reads it too.
 *
 * window.dzbanekRadio: toggle(key), play(key), stop(), nowPlaying(key), onChange(fn).
 * States: off, tuning, on, error.
 */
(function () {
  const STATIONS = {
    kiss: {
      name: 'Kiss Radio',
      stream: 'https://icecast4.play.cz/kiss128.mp3',
      now: 'https://radia.cz/api/v1/radio/radio-kiss/songs/now.json',
    },
    rock: {
      name: 'Rock Radio',
      // The bot uses the http:// address; a page served over https needs this one.
      stream: 'https://ice.abradio.cz/rockradio128.mp3',
      now: 'https://radia.cz/api/v1/radio/rock-radio/songs/now.json',
    },
    beat: {
      name: 'Radio Beat',
      stream: 'https://icecast3.play.cz/radiobeat128.mp3',
      now: 'https://radia.cz/api/v1/radio/radio-beat/songs/now.json',
    },
  };
  // About as often as the bot checks.
  const SONG_EVERY = 20000;

  const audio = new Audio();
  audio.preload = 'none';
  audio.volume = 0.7;

  let station = null;
  let state = 'off';
  let song = null;
  let songTimer;
  const listeners = [];

  function emit() {
    const info = { station, state, song };
    listeners.forEach((fn) => fn(info));
    document.dispatchEvent(new CustomEvent('dzbanek:radio', { detail: info }));
    media();
  }

  // What's on air right now, or null when radia.cz doesn't say (talk shows, ads, a hiccup).
  async function nowPlaying(key) {
    if (!STATIONS[key]) return null;
    try {
      const response = await fetch(STATIONS[key].now, { cache: 'no-store' });
      if (!response.ok) return null;
      const data = await response.json();
      if (!data || !data.song) return null;
      return { artist: data.interpret || '', title: data.song, cover: data.image || '' };
    } catch (e) {
      return null;
    }
  }

  async function refreshSong() {
    const key = station;
    if (!key) return;
    const found = await nowPlaying(key);
    if (key !== station) return;
    const changed = JSON.stringify(found) !== JSON.stringify(song);
    song = found;
    if (changed) emit();
  }

  function play(key) {
    if (!STATIONS[key]) return;
    station = key;
    state = 'tuning';
    song = null;
    emit();
    audio.src = STATIONS[key].stream;
    audio.play().catch(() => {
      if (station === key && state !== 'on') {
        state = 'error';
        emit();
      }
    });
    clearInterval(songTimer);
    refreshSong();
    songTimer = setInterval(refreshSong, SONG_EVERY);
  }

  function stop() {
    if (!station) return;
    clearInterval(songTimer);
    station = null;
    state = 'off';
    song = null;
    audio.pause();
    // Dropping the source closes the connection, so a stopped station stops downloading.
    audio.removeAttribute('src');
    audio.load();
    emit();
  }

  function toggle(key) {
    if (station === key && state !== 'error') stop();
    else play(key);
  }

  audio.addEventListener('playing', () => {
    if (!station || state === 'on') return;
    state = 'on';
    emit();
  });
  audio.addEventListener('error', () => {
    if (!station) return;
    state = 'error';
    emit();
  });

  // The phone's lock screen and the browser's media controls show the station and the song.
  function media() {
    if (!('mediaSession' in navigator)) return;
    if (!station || state === 'error') {
      navigator.mediaSession.metadata = null;
      return;
    }
    const name = STATIONS[station].name;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song ? song.title : name,
      artist: song ? song.artist : 'Dzbanek',
      album: name,
      artwork: song && song.cover ? [{ src: song.cover, sizes: '200x200', type: 'image/jpeg' }] : [],
    });
  }
  if ('mediaSession' in navigator) {
    try {
      navigator.mediaSession.setActionHandler('pause', stop);
      navigator.mediaSession.setActionHandler('stop', stop);
    } catch (e) {
      /* not every browser takes every action */
    }
  }

  // The ad's voice-over and the radio don't talk over each other.
  document.addEventListener('dzbanek:film-sound', stop);

  window.dzbanekRadio = {
    stations: STATIONS,
    play,
    stop,
    toggle,
    nowPlaying,
    onChange(fn) {
      listeners.push(fn);
      fn({ station, state, song });
    },
  };
})();
