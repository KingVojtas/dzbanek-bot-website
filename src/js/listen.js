/**
 * The seven stations, live in the browser: the same streams the bot plays in Discord
 * (src/radio/station.ts in the bot), in the bot's /radio order. One player for the whole
 * page, and nothing plays until someone presses a key.
 *
 * Song info: radia.cz for the Czech three (where the bot reads it too), Triton's public feed
 * for Frekvence 1, Global's now-playing socket for Heart and Capital, and for Radio Paradise
 * the title inside the stream itself (a few kilobytes up to the first ICY metadata block).
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
      // Global's id for the station (heraldId on globalplayer.com).
      global: '91',
    },
    capital: {
      name: 'Capital London',
      short: 'Capital',
      slogan: 'The UK’s No.1 Hit Music Station',
      stream: 'https://media-ssl.musicradio.com/CapitalMP3',
      global: '27',
    },
    paradise: {
      name: 'Radio Paradise',
      short: 'Paradise',
      slogan: 'Human curated radio',
      stream: 'https://stream.radioparadise.com/mp3-128',
      // Its stream answers this page's requests and sends the song every 16000 bytes.
      icy: true,
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

  // Global's player gets Heart and Capital's songs over one socket. It opens the first time it's
  // needed, keeps the latest track for each station, and opens again after it drops.
  const globalSongs = new Map();
  let globalSocket = null;

  function globalSubscribe(id) {
    if (globalSocket && globalSocket.readyState === WebSocket.OPEN) {
      globalSocket.send(JSON.stringify({ actions: [{ type: 'subscribe', service: id }] }));
    }
  }

  function fromGlobal(id) {
    if (!globalSocket || globalSocket.readyState > WebSocket.OPEN) {
      globalSocket = new WebSocket('wss://metadata.musicradio.com/v2/now-playing');
      globalSocket.addEventListener('open', () => Array.from(globalSongs.keys()).forEach(globalSubscribe));
      globalSocket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          const now = data.now_playing;
          if (!data.service) return;
          globalSongs.set(
            String(data.service),
            now && now.type === 'track' && now.title ? { artist: now.artist || '', title: now.title, cover: now.artwork || '' } : null
          );
        } catch (e) {
          /* not a now-playing message */
        }
      });
    }
    if (!globalSongs.has(id)) {
      globalSongs.set(id, undefined);
      globalSubscribe(id);
    }
    // The first answer takes a moment; after that the latest one is already here.
    return new Promise((resolve) => {
      let waited = 0;
      const check = () => {
        const found = globalSongs.get(id);
        if (found !== undefined || waited >= 5000) return resolve(found || null);
        waited += 250;
        setTimeout(check, 250);
      };
      check();
    });
  }

  // Radio Paradise: read the stream up to its first metadata block (icy-metaint is 16000) and stop.
  async function fromIcy(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(url, { headers: { 'Icy-MetaData': '1' }, cache: 'no-store', signal: controller.signal });
      if (!response.ok || !response.body) return null;
      const reader = response.body.getReader();
      const INTERVAL = 16000;
      const bytes = new Uint8Array(INTERVAL + 1 + 255 * 16);
      let have = 0;
      let need = INTERVAL + 1;
      while (have < need) {
        const { value, done } = await reader.read();
        if (done) return null;
        const take = Math.min(value.length, bytes.length - have);
        bytes.set(value.subarray(0, take), have);
        have += take;
        if (have > INTERVAL) need = INTERVAL + 1 + bytes[INTERVAL] * 16;
      }
      const meta = new TextDecoder().decode(bytes.subarray(INTERVAL + 1, need));
      const title = (meta.match(/StreamTitle='(.*?)';/) || [])[1] || '';
      const cover = (meta.match(/StreamUrl='(https?:\/\/[^']+\.(?:jpe?g|png|webp)(?:\?[^']*)?)';/i) || [])[1] || '';
      const [artist, ...rest] = title.split(' - ');
      if (!title) return null;
      return rest.length ? { artist: artist.trim(), title: rest.join(' - ').trim(), cover } : { artist: '', title: title.trim(), cover };
    } finally {
      clearTimeout(timeout);
      controller.abort();
    }
  }

  // What's on air right now, or null when nobody says (talk shows, ads, a hiccup).
  async function nowPlaying(key) {
    const station = STATIONS[key];
    if (!station) return null;
    try {
      if (station.triton) return await fromTriton(station.triton);
      if (station.global) return await fromGlobal(station.global);
      if (station.icy) return await fromIcy(station.stream);
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
