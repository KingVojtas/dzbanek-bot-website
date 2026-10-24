/**
 * The seven stations, live in the browser: the same streams the bot plays in Discord
 * (src/radio/station.ts in the bot), in the bot's /radio order. One player for the whole
 * page, and nothing plays until someone presses a key.
 *
 * Song info comes from radia.cz or Triton's public feed, where the bot reads it too.
 * Heart, Capital and Radio Paradise only name the song inside the stream, which a page
 * can't read, so the site shows their slogan instead.
 *
 * window.dzbanekRadio: stations, keys, toggle(key), play(key), stop(), nowPlaying(key), onChange(fn).
 * States: off, tuning, on, error.
 */
(function () {
  const radia = (slug) => 'https://radia.cz/api/v1/radio/' + slug + '/songs/now.json';
  const STATIONS = {
    kiss: {
      name: 'Kiss Radio',
      short: 'Kiss',
      slogan: '...be happy!',
      stream: 'https://icecast4.play.cz/kiss128.mp3',
      now: radia('radio-kiss'),
    },
    rock: {
      name: 'Rock Radio',
      short: 'Rock',
      slogan: 'Rock je slušná muzika',
      // The bot uses the http:// address; a page served over https needs this one.
      stream: 'https://ice.abradio.cz/rockradio128.mp3',
      now: radia('rock-radio'),
    },
    beat: {
      name: 'Radio Beat',
      short: 'Beat',
      slogan: 'První bigbít u nás',
      stream: 'https://icecast3.play.cz/radiobeat128.mp3',
      now: radia('radio-beat'),
    },
    frekvence1: {
      name: 'Frekvence 1',
      short: 'F1',
      slogan: 'Zapni rádio, vypni starosti',
      stream: 'https://ice.actve.net/fm-frekvence1-128',
      triton: 'FREKVENCE1',
    },
    heart: {
      name: 'Heart London',
      short: 'Heart',
      slogan: 'Turn up the feel good!',
      stream: 'https://media-ssl.musicradio.com/HeartLondonMP3',
    },
    capital: {
      name: 'Capital London',
      short: 'Capital',
      slogan: 'The UK’s No.1 Hit Music Station',
      stream: 'https://media-ssl.musicradio.com/CapitalMP3',
    },
    paradise: {
      name: 'Radio Paradise',
      short: 'Paradise',
      slogan: 'Human curated radio',
      stream: 'https://stream.radioparadise.com/mp3-128',
    },
  };
  const KEYS = Object.keys(STATIONS);
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

  // Triton's <nowplaying-info>: the latest track, unless it's over 20 minutes old (the bot's rule too).
  async function fromTriton(mount) {
    const response = await fetch(
      'https://np.tritondigital.com/public/nowplaying?mountName=' + mount + '&numberToFetch=1&eventType=track',
      { cache: 'no-store' }
    );
    if (!response.ok) return null;
    const xml = new DOMParser().parseFromString(await response.text(), 'text/xml');
    const info = xml.querySelector('nowplaying-info');
    if (!info) return null;
    const started = Number(info.getAttribute('timestamp')) * 1000;
    if (!started || Date.now() - started > 20 * 60 * 1000) return null;
    const prop = (name) => (info.querySelector('property[name="' + name + '"]')?.textContent || '').trim();
    const title = prop('cue_title');
    return title ? { artist: prop('track_artist_name'), title, cover: '' } : null;
  }

  // What's on air right now, or null when nobody says (talk shows, ads, a hiccup, or no feed at all).
  async function nowPlaying(key) {
    const station = STATIONS[key];
    if (!station) return null;
    try {
      if (station.triton) return await fromTriton(station.triton);
      if (!station.now) return null;
      const response = await fetch(station.now, { cache: 'no-store' });
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
    keys: KEYS,
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
