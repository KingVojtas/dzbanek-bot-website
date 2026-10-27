/**
 * The pretend #kitchen channel on commands.html. Everything runs in this tab:
 * no bot, no Discord, no network. The bot's own lines stay in English, the way
 * Discord shows them; only the chrome around them is translated.
 */
(function () {
  const root = document.querySelector('[data-demo]');
  if (!root) return;

  const log = root.querySelector('[data-demo-log]');
  const typing = root.querySelector('[data-demo-typing]');
  const form = root.querySelector('[data-demo-form]');
  const input = root.querySelector('#demo-input');
  const suggest = root.querySelector('[data-demo-suggest]');
  const suggestHead = root.querySelector('[data-demo-suggest-head]');
  const list = root.querySelector('#demo-list');
  const firstMessage = log.innerHTML;

  // The same picture the header uses, so it resolves from cs/ too.
  const AVATAR = document.querySelector('.brand-mark img')?.getAttribute('src') || 'assets/avatar.jpg';
  const SPEED = 10; // one real second plays ten seconds of a song

  const STATIONS = {
    kiss: { name: 'Kiss Radio', short: 'Kiss', color: '#e30613', slogan: '...be happy!', url: 'https://www.kiss.cz/' },
    rock: { name: 'Rock Radio', short: 'Rock', color: '#c8102e', slogan: 'Rock je slušná muzika', url: 'https://rockovyradio.cz/' },
    beat: { name: 'Radio Beat', short: 'Beat', color: '#f5c400', slogan: 'První bigbít u nás', url: 'https://www.radiobeat.cz/' },
    frekvence1: { name: 'Frekvence 1', short: 'F1', color: '#0033a0', slogan: 'Zapni rádio, vypni starosti', url: 'https://www.frekvence1.cz/' },
    heart: { name: 'Heart London', short: 'Heart', color: '#e2003b', slogan: 'Turn up the feel good!', url: 'https://www.heart.co.uk/' },
    capital: { name: 'Capital London', short: 'Capital', color: '#1472f5', slogan: 'The UK’s No.1 Hit Music Station', url: 'https://www.capitalfm.com/' },
    paradise: { name: 'Radio Paradise', short: 'Paradise', color: '#356457', slogan: 'Human curated radio', url: 'https://radioparadise.com/' },
  };
  // Made up, like everything in this channel.
  const ON_AIR = ['Iron Orchard - Highway Sermon', 'The Late Bakers - Midnight Crumbs', 'Paper Comets - Slow Steam'];
  const MIX = [
    'Kettle Song',
    'Crumbs on the Counter',
    'Midnight Pitcher',
    'Warm Mug Waltz',
    'Under-Cabinet Light',
    'Cookie Jar Blues',
    'Slow Steam',
    'Wooden Spoon',
  ];

  // The menu, in the order the bot's /help lists them.
  const COMMANDS = [
    { name: 'play', args: '[song or link]', desc: 'Play a YouTube or Spotify query', free: true },
    { name: 'queue', desc: 'Show the upcoming queue' },
    { name: 'nowplaying', desc: 'Bring the Now Playing card down here' },
    { name: 'skip', desc: 'Skip to the next track' },
    { name: 'pause', desc: 'Pause the music, or resume it' },
    { name: 'volume', args: '[25–150]', desc: 'Set the volume for everyone in voice', free: true },
    { name: 'remove', args: '[position]', desc: 'Drop one upcoming track', free: true },
    { name: 'stop', desc: 'Stop, clear the queue, and leave' },
    { name: 'radio play', args: '[station]', desc: 'Join your voice channel and start a radio station.', choices: 'stations' },
    { name: 'radio stop', desc: 'Turn the radio off' },
    { name: 'radio night', desc: 'Put Friday Radio Night on the calendar' },
    { name: 'radio night-off', desc: 'Take Radio Night off the calendar' },
    { name: 'radio dedicate', args: '[message]', desc: 'Send the Kitchen FM DJ a message to read on air', free: true },
    { name: 'steam link', args: '[profile]', desc: 'Let Wishlist Radar watch your wishlist', free: true },
    { name: 'steam wishlist', desc: 'Your wishlist with prices, sales first' },
    { name: 'steam unlink', desc: 'Stop watching your wishlist' },
    { name: 'quiz start', desc: 'Kitchen Quiz: name that tune' },
    { name: 'quiz stop', desc: 'End the quiz and show the podium' },
    { name: 'setup status', desc: 'Show this server’s channels' },
    { name: 'setup steam', desc: 'Pick where the Steam daily deals go' },
    { name: 'setup epic', desc: 'Pick where Epic’s free games go' },
    { name: 'setup welcome', desc: 'Pick where join messages go' },
    { name: 'setup goodbye', desc: 'Pick where leave messages go' },
    { name: 'setup kitchen', desc: 'Pick where the Kitchen Board hangs' },
    { name: 'setup wishlist', desc: 'Pick where Wishlist Radar pings people' },
    { name: 'setup idle-radio', desc: 'Fade into radio when the queue ends' },
    { name: 'setup wrapped-preview', desc: 'Kitchen Wrapped for this month so far' },
    { name: 'setup disable', args: '[feature]', desc: 'Stop posting something in this server', choices: 'features' },
    { name: 'textroom', args: '[name]', desc: 'Open a text room (admins)', free: true },
    { name: 'voiceroom', args: '[name]', desc: 'Open a voice room (admins)', free: true },
    { name: 'help', desc: 'Every command on one card' },
  ];

  const CHOICES = {
    stations: {
      head: ['demo.station', 'Station'],
      items: Object.keys(STATIONS)
        .map((key) => ({ key, name: STATIONS[key].name, desc: STATIONS[key].slogan, color: STATIONS[key].color }))
        .concat({ key: 'fm', name: 'Kitchen FM', desc: 'Your songs, with a DJ', color: 'var(--clay)' }),
    },
    features: {
      head: ['demo.feature', 'Feature'],
      items: [
        { key: 'steam', name: 'Steam deals', desc: '#steam-deals' },
        { key: 'epic', name: 'Epic free games', desc: '#epic-free' },
        { key: 'welcome', name: 'Welcome messages', desc: '#welcome' },
        { key: 'goodbye', name: 'Goodbye messages', desc: '#welcome' },
        { key: 'kitchen', name: 'Kitchen Board', desc: '#kitchen' },
        { key: 'radio-night', name: 'Radio Night', desc: 'Friday 20:00' },
        { key: 'idle-radio', name: 'Idle → radio', desc: 'After the queue ends' },
      ],
    },
  };

  // Where /setup points each feature in this fake server.
  const FEATURE_CHANNELS = { steam: 'steam-deals', epic: 'epic-free', welcome: 'welcome', goodbye: 'welcome', kitchen: 'kitchen', wishlist: 'wishlist-radar' };

  // The bot's own button faces (src/core/display/music.ts): Loop off, Repeat this song, Queue on repeat.
  const LOOP_LABELS = ['🔁 Loop', '🔂 Repeat', '🔁 Queue'];

  let state;
  function fresh() {
    return {
      track: null, // { title, length, elapsed }
      queue: [],
      paused: false,
      loop: 0,
      card: null,
      radio: null, // { key, card, song }
      fm: null, // Kitchen FM: { index, line, mine, paused, dedication, card }
      fmAfter: false, // a /play request cut in, and Kitchen FM carries on after it
      lastStation: 'beat',
      night: false,
      idle: true,
      off: new Set(), // features /setup disable switched off
      thinking: 0,
      volume: 100,
      history: [], // songs already played, for Previous
      plays: [], // every song that started, for /setup wrapped-preview
      linked: false, // Wishlist Radar
      quiz: null, // { round, score, card, timer }
    };
  }
  state = fresh();
  // Set once someone uses the demo, so the first look (at the bottom) never types over them.
  let touched = false;

  const timers = new Set();
  function later(fn, ms) {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
    return id;
  }

  const ui = (key, fallback) => (window.t && window.t(key)) || fallback;

  /* ---------- tiny DOM helper ---------- */

  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    Object.entries(props || {}).forEach(([key, value]) => {
      if (value == null || value === false) return;
      if (key === 'class') el.className = value;
      else if (key === 'text') el.textContent = value;
      else if (key === 'style') el.setAttribute('style', value);
      else if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
      else el.setAttribute(key, value === true ? '' : value);
    });
    kids.flat(Infinity).forEach((kid) => {
      if (kid == null || kid === false) return;
      el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    });
    return el;
  }

  const strong = (text) => h('strong', { text });

  function stamp() {
    const now = new Date();
    const time = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    return ui('clock.today', 'Today at {{time}}').replace('{{time}}', time);
  }

  function scrollDown() {
    log.scrollTo({ top: log.scrollHeight, behavior: 'smooth' });
  }

  function append(node) {
    node.classList.add('is-new');
    log.append(node);
    scrollDown();
    return node;
  }

  function retire(node) {
    if (!node || !node.isConnected) return;
    node.classList.add('is-leaving');
    later(() => node.remove(), 360);
  }

  function botMessage(...content) {
    return h(
      'div',
      { class: 'dc-msg' },
      h('img', { class: 'dc-avatar', src: AVATAR, alt: '', width: 40, height: 40 }),
      h(
        'div',
        { class: 'dc-body' },
        h('p', { class: 'dc-meta' }, h('strong', { class: 'dc-name', text: 'Dzbanek' }), h('span', { class: 'dc-tag', text: 'APP' }), h('time', { class: 'dc-time', text: stamp() })),
        content
      )
    );
  }

  function userMessage(text) {
    return h(
      'div',
      { class: 'dc-msg' },
      h('span', { class: 'dc-avatar you', 'aria-hidden': 'true', text: 'Y' }),
      h(
        'div',
        { class: 'dc-body' },
        h('p', { class: 'dc-meta' }, h('strong', { class: 'dc-name you', text: 'you' }), h('time', { class: 'dc-time', text: stamp() })),
        h('p', { class: 'dc-text', text })
      )
    );
  }

  function usedLine(command) {
    return h('p', { class: 'dc-used' }, h('span', { class: 'mini-you', 'aria-hidden': 'true' }), h('b', { text: 'you' }), ' used ', h('b', { text: command }));
  }

  function text(...parts) {
    return h('p', { class: 'dc-text' }, parts);
  }

  function onlyYou(...parts) {
    return [h('p', { class: 'dc-ephemeral', text: ui('radio.onlyYou', 'Only you can see this') }), text(...parts)];
  }

  function embed({ bar, author, title, desc, children, footer, thumb }) {
    return h(
      'div',
      { class: 'dc-embed', style: '--bar: ' + (bar || 'var(--clay)') },
      h(
        'div',
        { class: 'dc-embed-main' },
        author && h('p', { class: 'dc-embed-author' }, author),
        title && h('p', { class: 'dc-embed-title', text: title }),
        desc && h('p', { class: 'dc-embed-desc' }, desc),
        children,
        footer && h('p', { class: 'dc-embed-footer', text: footer })
      ),
      thumb
    );
  }

  function fields(rows) {
    return h(
      'dl',
      { class: 'dc-fields' },
      rows.map(([name, value, wide]) => h('div', { class: wide ? 'wide' : null }, h('dt', { text: name }), h('dd', {}, value)))
    );
  }

  function button(label, onClick, { red = false, blurple = false, green = false, disabled = false } = {}) {
    const style = red ? ' dc-btn-red' : blurple ? ' dc-btn-blurple' : green ? ' dc-btn-green' : '';
    return h('button', { type: 'button', class: 'dc-btn' + style, disabled, onclick: onClick, text: label });
  }

  function row(...buttons) {
    return h('div', { class: 'dc-row' }, buttons);
  }

  // A #channel mention. The ones in the sidebar open that channel, like in Discord.
  function channelLink(name) {
    if (name !== 'kitchen' && !root.querySelector('[data-demo-pane="' + name + '"]')) return h('span', { class: 'dc-mention', text: '#' + name });
    return h('button', { type: 'button', class: 'dc-mention', onclick: () => showChannel(name), text: '#' + name });
  }

  // Bot replies arrive after a short "thinking" beat, like a deferred interaction.
  function reply(build, delay = 650) {
    state.thinking += 1;
    typing.hidden = channel !== 'kitchen';
    later(() => {
      state.thinking -= 1;
      if (state.thinking <= 0) {
        state.thinking = 0;
        typing.hidden = true;
      }
      const node = build();
      if (node) append(node);
    }, delay);
  }

  /* ---------- music ---------- */

  function lengthOf(title) {
    let hash = 0;
    for (const ch of title) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    return 150 + (hash % 100); // 2:30 – 4:09
  }

  const clock = (seconds) => Math.floor(seconds / 60) + ':' + String(Math.floor(seconds % 60)).padStart(2, '0');

  let ticker = 0;
  function tick() {
    const track = state.track;
    if (!track || !state.card) return;
    if (!state.paused) track.elapsed = Math.min(track.length, track.elapsed + 0.25 * SPEED);
    const bar = state.card.querySelector('.progress span');
    const at = state.card.querySelector('[data-at]');
    if (bar) bar.style.transform = 'scaleX(' + (track.elapsed / track.length).toFixed(4) + ')';
    if (at) at.textContent = clock(track.elapsed);
    if (track.elapsed >= track.length) finish();
  }

  function nowPlaying() {
    const track = state.track;
    const loopBtn = button(LOOP_LABELS[state.loop], () => {
      state.loop = (state.loop + 1) % LOOP_LABELS.length;
      loopBtn.textContent = LOOP_LABELS[state.loop];
      loopBtn.classList.toggle('dc-btn-green', state.loop > 0);
    });
    loopBtn.classList.toggle('dc-btn-green', state.loop > 0);

    const pauseBtn = button(state.paused ? '▶️ Resume' : '⏸️ Pause', () => togglePause(), { blurple: !state.paused, green: state.paused });
    pauseBtn.setAttribute('data-pause', '');
    const volume = (step) => () => setVolume(state.volume + step);

    const card = botMessage(
      embed({
        bar: 'var(--clay)',
        author: ['🔊 ', 'Now Playing'],
        title: track.title,
        desc: ['Requested by ', h('span', { class: 'dc-mention', text: '@you' }), ' · YouTube'],
        children: h(
          'div',
          { class: 'dc-progress' },
          h('span', { class: 'mono', 'data-at': '', text: clock(track.elapsed) }),
          h('div', { class: 'progress manual' }, h('span')),
          h('span', { class: 'mono', text: clock(track.length) })
        ),
        footer: footerText(),
        thumb: h('div', { class: 'dc-embed-thumb vinyl', 'aria-hidden': 'true' }, h('span')),
      }),
      row(
        pauseBtn,
        button('⏭️ Skip', skip),
        button('⏹️ Stop', () => stopAll('⏹️ Stopped. The queue is cleared and I’ve left the channel.'), { red: true }),
        loopBtn,
        button('🔀 Shuffle', shuffle)
      ),
      row(
        button('⏮️ Previous', previous, { disabled: !state.history.length }),
        button('🔉', volume(-25), { disabled: state.volume <= 25 }),
        button('🔊', volume(25), { disabled: state.volume >= 150 }),
        button('📜 Queue', () => handlers.queue())
      )
    );
    card.classList.toggle('paused', state.paused);
    return card;
  }

  // Starting a new song clears the old Now Playing card.
  function startTrack(title) {
    retire(state.card);
    state.track = { title, length: lengthOf(title), elapsed: 0 };
    state.plays.push(title);
    state.paused = false;
    state.card = append(nowPlaying());
    clearInterval(ticker);
    ticker = setInterval(tick, 250);
  }

  function footerText() {
    return (state.queue.length ? state.queue.length + ' up next' : 'Nothing up next') + ' · Volume ' + state.volume + '%';
  }

  function refreshFooter() {
    const footer = state.card && state.card.querySelector('.dc-embed-footer');
    if (footer) footer.textContent = footerText();
  }

  function togglePause() {
    if (!state.track) return false;
    state.paused = !state.paused;
    const pauseBtn = state.card && state.card.querySelector('[data-pause]');
    if (pauseBtn) {
      pauseBtn.textContent = state.paused ? '▶️ Resume' : '⏸️ Pause';
      pauseBtn.classList.toggle('dc-btn-blurple', !state.paused);
      pauseBtn.classList.toggle('dc-btn-green', state.paused);
    }
    if (state.card) state.card.classList.toggle('paused', state.paused);
    return true;
  }

  function setVolume(percent) {
    state.volume = Math.min(150, Math.max(25, Math.round(percent)));
    if (state.card) {
      const [down, up] = state.card.querySelectorAll('.dc-row:last-child .dc-btn:nth-child(2), .dc-row:last-child .dc-btn:nth-child(3)');
      if (down) down.disabled = state.volume <= 25;
      if (up) up.disabled = state.volume >= 150;
    }
    refreshFooter();
  }

  function previous() {
    if (!state.history.length) return;
    if (state.track) state.queue.unshift(state.track.title);
    startTrack(state.history.pop());
  }

  function finish() {
    const done = state.track.title;
    if (state.loop === 1) {
      state.track.elapsed = 0;
      return;
    }
    state.history.push(done);
    if (state.loop === 2) state.queue.push(done);
    if (state.queue.length) {
      startTrack(state.queue.shift());
      return;
    }
    clearInterval(ticker);
    retire(state.card);
    state.card = null;
    state.track = null;
    if (state.fmAfter) {
      state.fmAfter = false;
      later(() => startFm(true), 600);
      return;
    }
    if (!state.idle) {
      append(botMessage(text('👋 The queue is done. See you next time.')));
      return;
    }
    later(() => {
      append(h('p', { class: 'dc-divider' }, h('span', { text: '120 quiet seconds later' })));
      startRadio(state.lastStation, true);
    }, 900);
  }

  function skip() {
    if (!state.track) return;
    if (!state.queue.length && state.loop !== 2) {
      append(botMessage(...onlyYou('Nothing up next. Add something with ', h('code', { text: '/play' }), '.')));
      return;
    }
    state.history.push(state.track.title);
    if (state.loop === 2) state.queue.push(state.track.title);
    startTrack(state.queue.shift());
  }

  function shuffle() {
    if (state.queue.length < 2) {
      append(botMessage(...onlyYou('Not enough in the queue to shuffle.')));
      return;
    }
    for (let i = state.queue.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [state.queue[i], state.queue[j]] = [state.queue[j], state.queue[i]];
    }
    append(botMessage(...onlyYou('🔀 Shuffled ' + state.queue.length + ' tracks. Next up: ', strong(state.queue[0]), '.')));
  }

  function stopMusic() {
    clearInterval(ticker);
    retire(state.card);
    state.card = null;
    state.track = null;
    state.queue = [];
    state.paused = false;
  }

  function stopAll(message) {
    const had = state.track || state.radio || state.fm;
    stopMusic();
    stopRadio();
    stopFm();
    state.fmAfter = false;
    if (message && had) append(botMessage(text(message)));
  }

  /* ---------- radio ---------- */

  let radioTimer = 0;

  // ON_AIR lines are "Artist - Title".
  const split = (line) => {
    const [artist, ...title] = line.split(' - ');
    return { artist, title: title.join(' - ') };
  };

  // The bot's live card (src/radio/embed.ts): the song as the title, "by" the artist, the slogan,
  // the voice channel; Catch, Stop, Website.
  function radioCard(key) {
    const station = STATIONS[key];
    const first = split(ON_AIR[0]);
    const song = h('p', { class: 'dc-embed-title dc-link', text: first.title });
    const artist = h('strong', { text: first.artist });
    const edited = h('span', { class: 'dc-muted' });
    const card = botMessage(
      embed({
        bar: station.color,
        author: '🔴 LIVE · ' + station.name,
        children: [
          song,
          h('p', { class: 'dc-embed-desc' }, 'by ', artist, h('br'), h('em', { text: station.slogan }), h('br'), '🎧 in 🔊 Lounge ', edited),
        ],
        footer: 'On air since',
      }),
      row(
        button('🍪 Catch', () => catchSong(song.textContent, artist.textContent), { blurple: true }),
        button('⏹️ Stop', () => {
          if (stopRadio()) append(botMessage(text('📻 Radio off.')));
        }, { red: true }),
        h('a', { class: 'dc-btn', href: station.url, target: '_blank', rel: 'noopener noreferrer', text: '🌐 Website' })
      )
    );
    return { card, song, artist, edited };
  }

  function startRadio(key, quiet) {
    if (state.track) {
      stopMusic();
      if (!quiet) append(botMessage(text('🎶 Music handed the speaker to the radio.')));
    }
    stopFm();
    state.fmAfter = false;
    if (state.radio) retire(state.radio.card);
    const made = radioCard(key);
    state.radio = { key, card: append(made.card), index: 0 };
    state.lastStation = key;
    clearInterval(radioTimer);
    radioTimer = setInterval(() => {
      if (!state.radio) return;
      state.radio.index = (state.radio.index + 1) % ON_AIR.length;
      const now = split(ON_AIR[state.radio.index]);
      made.song.textContent = now.title;
      made.artist.textContent = now.artist;
      made.edited.textContent = '(edited)';
    }, 12000);
  }

  function stopRadio() {
    if (!state.radio) return false;
    clearInterval(radioTimer);
    retire(state.radio.card);
    state.radio = null;
    return true;
  }

  /* ---------- Kitchen FM ---------- */

  // The kitchen's own station (src/fm in the bot): the kitchen's songs a genre at a time, the DJ talking
  // before each set, a dedication read before the next song, and 🔥 / 👎 once per person per song.
  const FM_SET = [
    { title: 'Sušenky na lince', artist: 'MC Plech', by: 'Nova', fires: 3, length: 185 },
    { title: 'Plechový beat', artist: 'Dvě lžíce', find: true, fires: 0, length: 212 },
    { title: 'Večerní linka', artist: 'Rohlík & Máslo', by: 'Milo', fires: 2, length: 198 },
  ];

  function djOpener(song) {
    const hour = new Date().getHours();
    const time = (hour % 12 || 12) + (hour < 12 ? ' AM' : ' PM');
    return 'It’s ' + time + ' and The Kitchen is open. For the next few songs it’s Czech rap, starting with ' + song.title + ' by ' + song.artist + '. Brought in by ' + song.by + '.';
  }

  function fmCard() {
    const fm = state.fm;
    const song = FM_SET[fm.index];
    const fire = button('', () => react('fire'));
    const nope = button('👎', () => react('nope'));
    function paint() {
      fire.textContent = '🔥 ' + (song.fires + (fm.mine === 'fire' ? 1 : 0));
      fire.classList.toggle('is-hot', fm.mine === 'fire');
      nope.classList.toggle('is-on', fm.mine === 'nope');
    }
    // Press again to take it back, or the other one to switch.
    function react(kind) {
      fm.mine = fm.mine === kind ? null : kind;
      paint();
    }
    paint();
    const pause = button(fm.paused ? '▶️ Resume' : '⏸️ Pause', () => {
      fm.paused = !fm.paused;
      pause.textContent = fm.paused ? '▶️ Resume' : '⏸️ Pause';
      pause.classList.toggle('dc-btn-blurple', !fm.paused);
      pause.classList.toggle('dc-btn-green', fm.paused);
      card.classList.toggle('paused', fm.paused);
    }, { blurple: !fm.paused, green: fm.paused });
    const card = botMessage(
      embed({
        bar: 'var(--clay)',
        author: '🎙️ Kitchen FM · Czech rap' + (song.find ? ' · new find' : ''),
        title: song.title,
        desc: ['by ', strong(song.artist)],
        children: [
          h('div', { class: 'dc-progress' }, h('span', { class: 'mono', text: '0:00' }), h('div', { class: 'progress manual' }, h('span')), h('span', { class: 'mono', text: clock(song.length) })),
          fm.line && h('p', { class: 'dc-quote' }, '🎙️ ', h('i', { text: fm.line })),
          fields([
            ['Brought in by', song.by ? h('span', { class: 'dc-mention', text: '@' + song.by }) : '🧭 A new find'],
            ['Volume', '🔊 ' + state.volume + '%'],
            ['Up next', '🎙️ Kitchen FM picks one. /play to request.', true],
          ]),
        ],
        footer: 'Kitchen FM on air',
        thumb: h('div', { class: 'dc-embed-thumb vinyl', 'aria-hidden': 'true' }, h('span')),
      }),
      row(
        pause,
        button('⏭️ Skip', () => fmNext()),
        button('⏹️ Stop', () => {
          if (stopFm()) append(botMessage(text('⏹️ Kitchen FM is off the air. See you next show.')));
        }, { red: true })
      ),
      row(fire, nope)
    );
    return card;
  }

  function startFm(quiet) {
    if (state.track) {
      stopMusic();
      if (!quiet) append(botMessage(text('🎶 Music handed the speaker to Kitchen FM.')));
    }
    stopRadio();
    retire(state.fm && state.fm.card);
    state.fm = { index: 0, line: djOpener(FM_SET[0]), mine: null, paused: false, dedication: null, card: null };
    state.fm.card = append(fmCard());
  }

  // The next song: a waiting dedication is read before it; the DJ opens each new set.
  function fmNext() {
    const fm = state.fm;
    if (!fm) return;
    fm.index = (fm.index + 1) % FM_SET.length;
    const song = FM_SET[fm.index];
    fm.line = fm.dedication ? 'A message from you: “' + fm.dedication + '”. Here’s ' + song.title + '.' : fm.index === 0 ? djOpener(song) : null;
    fm.dedication = null;
    fm.mine = null;
    fm.paused = false;
    retire(fm.card);
    fm.card = append(fmCard());
  }

  function stopFm() {
    if (!state.fm) return false;
    retire(state.fm.card);
    state.fm = null;
    return true;
  }

  // The bot posts a catch for everyone to see; only the catcher can press Play.
  function catchSong(title, artist) {
    const play = button('▶️ Play', () => {
      play.disabled = true;
      run('/play ' + artist + ' - ' + title);
    }, { blurple: true });
    append(botMessage(text('🍪 ', strong('you'), ' caught ', strong(title), ' — ' + artist), row(play)));
  }

  /* ---------- Kitchen Quiz ---------- */

  // The real quiz plays a 15-second clip and gives everyone 20 seconds; here there's no sound,
  // so the "clip" is the song title's mood, and three rounds are enough.
  const QUIZ_ROUNDS = 3;
  const QUIZ_HINTS = ['Soft piano, a kettle in the background…', 'Brushed drums, somebody humming…', 'Slow bass, rain on the window…'];
  let quizTimer = 0;

  function quizRound() {
    const quiz = state.quiz;
    quiz.round += 1;
    const pool = MIX.slice().sort(() => Math.random() - 0.5).slice(0, 4);
    const answer = Math.floor(Math.random() * 4);
    const started = Date.now();
    let done = false;
    const buttons = pool.map((title, i) =>
      button('ABCD'[i] + ' · ' + title, () => pick(i))
    );
    const result = h('p', { class: 'dc-embed-footer', text: '20 seconds to answer' });
    function pick(choice) {
      if (done || state.quiz !== quiz) return;
      done = true;
      clearTimeout(quizTimer);
      buttons.forEach((btn, i) => {
        btn.disabled = true;
        if (i === answer) btn.classList.add('dc-btn-green');
      });
      if (choice === answer) {
        // Same as the bot: 100 for a right answer, up to 50 more for speed.
        const points = 100 + Math.round(50 * Math.max(0, 1 - (Date.now() - started) / 20000));
        quiz.score += points;
        result.textContent = '✅ Right! +' + points + ' points · ' + quiz.score + ' total';
      } else {
        result.textContent = (choice === null ? '⏱️ Time’s up.' : '❌ Not that one.') + ' It was ' + pool[answer] + '.';
      }
      later(() => {
        if (state.quiz !== quiz) return;
        if (quiz.round >= QUIZ_ROUNDS) quizEnd();
        else quizRound();
      }, 1800);
    }
    quiz.card = append(
      botMessage(
        embed({
          bar: '#c4783a',
          author: '🎧 Kitchen Quiz · Round ' + quiz.round + ' of ' + QUIZ_ROUNDS,
          title: 'Which song is this?',
          desc: h('em', { text: QUIZ_HINTS[(quiz.round - 1) % QUIZ_HINTS.length] }),
          children: result,
        }),
        row(...buttons.slice(0, 2)),
        row(...buttons.slice(2))
      )
    );
    clearTimeout(quizTimer);
    quizTimer = later(() => pick(null), 20000);
  }

  function quizEnd() {
    const quiz = state.quiz;
    if (!quiz) return;
    clearTimeout(quizTimer);
    state.quiz = null;
    append(
      botMessage(
        embed({
          bar: '#c4783a',
          author: '🏆 Kitchen Quiz · Podium',
          title: quiz.score ? '🥇 you · ' + quiz.score + ' points' : 'Nobody scored this time',
          desc: 'In a real server everyone in voice plays at once. A right answer is worth 100 points, up to 50 more for speed, and a bonus every third one in a row.',
        }),
        row(button('🔁 Play again', () => run('/quiz start'), { blurple: true }))
      )
    );
  }

  /* ---------- commands ---------- */

  const handlers = {
    play(rest) {
      const wantsNext = /\bplay_next\b/i.test(rest);
      const query = rest.replace(/\bplay_next(:\s*\S+)?/i, '').trim().slice(0, 80);
      const tracks = query ? [query] : MIX.slice();
      const playlist = !query;

      reply(() => {
        if (state.radio) {
          stopRadio();
          append(botMessage(text('📻 The radio handed the speaker to the music.')));
        }
        if (state.fm) {
          stopFm();
          state.fmAfter = true;
          append(botMessage(text('🎙️ Requests go first. Kitchen FM carries on after this one.')));
        }
        if (!state.track) {
          startTrack(tracks.shift());
          state.queue.push(...tracks);
          refreshFooter();
          return playlist
            ? botMessage(text('📜 Loaded ', strong(MIX.length + ' tracks'), ' from ', strong('Kitchen Mix'), ' (Spotify playlist). The audio comes from YouTube.'))
            : null;
        }
        const room = 100 - state.queue.length;
        if (room <= 0) return botMessage(...onlyYou('The queue is full — 100 tracks is the limit.'));
        const adding = tracks.slice(0, room);
        if (wantsNext) state.queue.unshift(...adding);
        else state.queue.push(...adding);
        refreshFooter();
        const position = wantsNext ? 1 : state.queue.length - adding.length + 1;
        return botMessage(
          playlist
            ? text('➕ Added ', strong(adding.length + ' tracks'), ' from Kitchen Mix to the queue.')
            : text('➕ Queued ', strong(adding[0]), ' at position #' + position + '.')
        );
      });
    },

    queue() {
      reply(() => {
        if (!state.track && !state.queue.length) {
          return botMessage(...onlyYou('The queue is empty. Try ', h('code', { text: '/play' }), '.'));
        }
        let page = 0;
        const per = 5;
        const pages = () => Math.max(1, Math.ceil(state.queue.length / per));
        const listEl = h('ol', { class: 'dc-queue' });
        const footer = h('p', { class: 'dc-embed-footer' });
        const prev = button('◀ Prev', () => draw(page - 1));
        const next = button('Next ▶', () => draw(page + 1));
        function draw(to) {
          page = Math.min(Math.max(0, to), pages() - 1);
          const slice = state.queue.slice(page * per, page * per + per);
          listEl.replaceChildren(
            ...(slice.length
              ? slice.map((title, i) => h('li', {}, h('span', { text: page * per + i + 1 + '.' }), title))
              : [h('li', {}, h('span', { text: '–' }), 'Nothing up next')])
          );
          footer.textContent = 'Page ' + (page + 1) + ' of ' + pages() + ' · ' + state.queue.length + ' up next';
          prev.disabled = page === 0;
          next.disabled = page >= pages() - 1;
        }
        const card = botMessage(
          embed({
            bar: 'var(--clay)',
            author: '📜 Queue',
            desc: state.track ? ['Now: ', strong(state.track.title)] : null,
            children: [listEl, footer],
          }),
          row(prev, next)
        );
        draw(0);
        return card;
      });
    },

    stop() {
      reply(() => {
        if (!state.track && !state.radio && !state.fm) return botMessage(...onlyYou('Nothing is playing.'));
        stopAll();
        return botMessage(text('⏹️ Stopped. The queue is cleared and I’ve left the channel.'));
      });
    },

    remove(rest) {
      const n = parseInt(rest, 10) || 1;
      reply(() => {
        if (!state.queue.length) return botMessage(...onlyYou('The queue is empty.'));
        if (n < 1 || n > state.queue.length) return botMessage(...onlyYou('There’s no track at position ' + n + '.'));
        const [gone] = state.queue.splice(n - 1, 1);
        refreshFooter();
        return botMessage(text('🗑️ Removed #' + n + ': ', strong(gone), '.'));
      });
    },

    'radio play'(rest) {
      const key = pickStation(rest);
      if (!key) {
        openWith('/radio play ');
        return false;
      }
      reply(() => {
        if (key === 'fm') startFm();
        else startRadio(key);
        return null;
      });
    },

    'radio stop'() {
      reply(() => {
        // It ends the show, also while a /play request has cut in.
        if (stopFm() || state.fmAfter) {
          state.fmAfter = false;
          return botMessage(text('⏹️ Kitchen FM is off the air. See you next show.'));
        }
        return stopRadio() ? botMessage(text('📻 Radio off.')) : botMessage(...onlyYou('The radio isn’t on.'));
      });
    },

    'radio dedicate'(rest) {
      const message = rest.replace(/^message:\s*/i, '').trim().slice(0, 120);
      if (!message) {
        openWith('/radio dedicate ');
        return false;
      }
      reply(() => {
        if (!state.fm) return botMessage(...onlyYou('Kitchen FM isn’t on. Start it with ', h('code', { text: '/radio play station:Kitchen FM' }), '.'));
        if (state.fm.dedication) return botMessage(...onlyYou('Your dedication is already waiting. The DJ reads it before the next song.'));
        state.fm.dedication = message;
        // The DJ reads it before the next song, which comes a little sooner here than in Discord.
        later(fmNext, 2600);
        return botMessage(embed({ bar: 'var(--dc-green)', desc: '💌 Your dedication is in. The DJ reads it before the next song.' }));
      });
    },

    'radio night'() {
      state.night = true;
      reply(() =>
        botMessage(
          embed({
            bar: 'var(--beat)',
            author: '🌙 Radio Night',
            title: 'On the calendar',
            children: fields([
              ['When', 'Friday 20:00 (Prague)'],
              ['Fallback', STATIONS[state.lastStation].name],
              ['Vote', 'Opens Friday 12:00 on the Kitchen Board', true],
            ]),
          })
        )
      );
    },

    'radio night-off'() {
      const was = state.night;
      state.night = false;
      reply(() => (was ? botMessage(text('🌙 Radio Night is off the calendar.')) : botMessage(...onlyYou('Radio Night wasn’t scheduled.'))));
    },

    nowplaying() {
      reply(() => {
        if (!state.track) return botMessage(...onlyYou('Nothing is playing.'));
        retire(state.card);
        state.card = append(nowPlaying());
        return null;
      });
    },

    skip() {
      reply(() => {
        if (!state.track) return botMessage(...onlyYou('Nothing is playing.'));
        skip();
        return null;
      });
    },

    pause() {
      reply(() => {
        if (!togglePause()) return botMessage(...onlyYou('Nothing is playing.'));
        return botMessage(text(state.paused ? '⏸️ Paused.' : '▶️ Playing again.'));
      });
    },

    volume(rest) {
      const n = parseInt(rest, 10);
      reply(() => {
        if (!n) return botMessage(...onlyYou('Give it a number from 25 to 150. 100 is normal.'));
        setVolume(n);
        return botMessage(text((state.volume < 100 ? '🔉' : '🔊') + ' Volume is ' + state.volume + '% for everyone in the channel.'));
      });
    },

    'steam link'(rest) {
      const profile = rest.slice(0, 40) || 'your Steam profile';
      state.linked = true;
      reply(() => botMessage(text('🎯 Linked ', strong(profile), '. Wishlist Radar will ping you when a game on your wishlist goes on sale.')));
    },

    'steam wishlist'() {
      reply(() => {
        if (!state.linked) return botMessage(...onlyYou('Link your Steam profile first with ', h('code', { text: '/steam link' }), '.'));
        const games = [
          ['Hollow Lantern', 'Sale', '−80%', '€3.99'],
          ['Neon Ledger', 'Sale', '−60%', '€7.99'],
          ['Quiet Harbor', '', '', '€19.99'],
          ['Star Forge Tactics', '', '', '€24.99'],
        ];
        return botMessage(
          embed({
            bar: '#66c0f4',
            author: '🎯 Your wishlist',
            desc: '2 on sale right now',
            children: h(
              'ol',
              { class: 'digest' },
              games.map(([game, chip, disc, price]) =>
                h('li', {}, h('span', { class: 'game', text: game }), h('span', { class: 'chip-vp', text: chip }), disc ? h('span', { class: 'disc', text: disc }) : h('span'), h('span', { class: 'price', text: price }))
              )
            ),
            footer: 'Page 1 of 1 · sales first',
          })
        );
      });
    },

    'steam unlink'() {
      const was = state.linked;
      state.linked = false;
      reply(() => (was ? botMessage(text('🎯 Wishlist Radar stopped watching your wishlist.')) : botMessage(...onlyYou('No Steam profile is linked.'))));
    },

    'quiz start'() {
      reply(() => {
        if (state.quiz) return botMessage(...onlyYou('A quiz is already running. ', h('code', { text: '/quiz stop' }), ' ends it.'));
        if (state.track || state.radio || state.fm) {
          stopMusic();
          stopRadio();
          stopFm();
          state.fmAfter = false;
          append(botMessage(text('🎧 Music and radio step aside while the quiz runs.')));
        }
        state.quiz = { round: 0, score: 0, card: null, timer: 0 };
        quizRound();
        return null;
      });
    },

    'quiz stop'() {
      reply(() => {
        if (!state.quiz) return botMessage(...onlyYou('There’s no quiz running.'));
        quizEnd();
        return null;
      });
    },

    'setup wishlist'() {
      reply(() => botMessage(text('🎯 Wishlist Radar will post in ', channelLink('wishlist-radar'), ' and ping people there when their wishlist goes on sale.')));
    },

    // The bot's own /setup replies, pointed at the demo's channels.
    'setup steam'() {
      state.off.delete('steam');
      reply(() => botMessage(text('✅ Steam daily deals will post in ', channelLink('steam-deals'), '. New deals appear on the next scheduled poll.')));
    },

    'setup epic'() {
      state.off.delete('epic');
      reply(() => botMessage(text('✅ Epic free games will post in ', channelLink('epic-free'), '. A new lineup appears on the next scheduled poll.')));
    },

    'setup welcome'() {
      state.off.delete('welcome');
      reply(() => botMessage(text('✅ Welcome messages will post in ', channelLink('welcome'), '.')));
    },

    'setup goodbye'() {
      state.off.delete('goodbye');
      reply(() => botMessage(text('✅ Goodbye messages will post in ', channelLink('welcome'), '.')));
    },

    'setup disable'(rest) {
      const feature = pickChoice('features', rest);
      if (!feature) {
        openWith('/setup disable ');
        return false;
      }
      if (feature.key === 'radio-night') state.night = false;
      else if (feature.key === 'idle-radio') state.idle = false;
      else state.off.add(feature.key);
      const done = {
        steam: 'Steam deals will no longer post in this server.',
        epic: 'Epic free games will no longer post in this server.',
        welcome: 'Welcome messages will no longer post in this server.',
        goodbye: 'Goodbye messages will no longer post in this server.',
        kitchen: 'The Kitchen Board will no longer update in this server.',
        'radio-night': 'Radio Night is off.',
        'idle-radio': 'Idle → radio is off. After the music queue ends I’ll leave like before.',
      };
      reply(() => botMessage(...onlyYou('✅ ' + done[feature.key])));
    },

    textroom(rest) {
      const name = (rest || 'snacks').toLowerCase().replace(/[^a-z0-9á-ž-]+/gi, '-').slice(0, 24);
      reply(() => botMessage(text('🚪 Opened ', h('span', { class: 'dc-mention', text: '#🍪・' + name }), '. Rooms are for admins, and you are one here.')));
    },

    voiceroom(rest) {
      const name = (rest || 'chill').slice(0, 24);
      reply(() => botMessage(text('🚪 Opened ', h('span', { class: 'dc-mention', text: '🔊 🎧・' + name }), '. Rooms are for admins, and you are one here.')));
    },

    help() {
      const groups = [
        ['🎵 Music', ['/play', '/queue', '/nowplaying', '/skip', '/pause', '/volume', '/remove', '/stop']],
        ['📻 Radio', ['/radio play', '/radio stop', '/radio night', '/radio night-off', '/radio dedicate']],
        ['🎯 Steam wishlist', ['/steam link', '/steam wishlist', '/steam unlink']],
        ['🎧 Kitchen Quiz', ['/quiz start', '/quiz stop']],
        ['🍪 Kitchen & setup · Manage Server', ['/setup steam', '/setup epic', '/setup welcome', '/setup goodbye', '/setup kitchen', '/setup wishlist', '/setup idle-radio', '/setup status', '/setup disable', '/setup wrapped-preview']],
        ['🚪 Rooms · Admin', ['/textroom', '/voiceroom']],
        ['❓ Help', ['/help']],
      ];
      // The kitchen words the bot's /help explains for anyone new (src/commands/help.ts).
      const words = [
        ['Kitchen', 'your server. Dzbanek calls every server a kitchen.'],
        ['Kitchen Board', 'one live card in a channel you pick with /setup kitchen: what’s playing, today’s deals, the latest catch.'],
        ['Kitchen FM', 'your server’s own station, made from the songs you /play and catch, with a DJ between sets.'],
        ['🍪 Catch', 'the button on a radio card that saves the song on air, so you can play it later.'],
        ['Radio Night', 'a Friday vote for a station. The winner plays at 20:00 Prague time.'],
        ['Chef of the week', 'whoever brought the songs the kitchen 🔥 most that week.'],
        ['Kitchen Wrapped', 'last month in songs, posted on the 1st.'],
      ];
      const invite = document.querySelector('a[data-invite]')?.getAttribute('href') || '#';
      reply(() =>
        botMessage(
          embed({
            bar: '#c4783a',
            author: '🍪 What’s cooking',
            desc: 'Dzbanek streams seven live radio stations from Prague, London and California, and runs Kitchen FM, your server’s own station with a DJ. It also plays YouTube and Spotify, hosts a song quiz, posts Steam deals and Epic freebies, pings you when your Steam wishlist goes on sale, and keeps the Kitchen Board up to date.',
            children: [
              groups.map(([title, names]) =>
                h('div', { class: 'dc-help-group' }, h('p', { class: 'dc-help-title', text: title }), h('p', { class: 'dc-help-cmds' }, names.map((name) => h('code', { text: name }))))
              ),
              h('div', { class: 'dc-help-group dc-help-words' }, h('p', { class: 'dc-help-title', text: '🍪 Kitchen words' }), words.map(([word, meaning]) => h('p', {}, strong(word), ' · ' + meaning))),
            ],
            footer: 'Pause, skip, previous, volume, loop and shuffle also live as buttons on the Now Playing card.',
          }),
          row(
            h('a', { class: 'dc-btn', href: invite, target: '_blank', rel: 'noopener noreferrer', text: '➕ Add to a server' }),
            h('a', { class: 'dc-btn', href: 'index.html', text: '🌐 Website' })
          )
        )
      );
    },

    'setup status'() {
      reply(() =>
        botMessage(
          embed({
            bar: 'var(--clay)',
            author: '⚙️ Setup',
            title: 'Example Server',
            children: fields([
              ...[
                ['Steam', 'steam'],
                ['Epic', 'epic'],
                ['Welcome', 'welcome'],
                ['Goodbye', 'goodbye'],
                ['Kitchen Board', 'kitchen'],
                ['Wishlist Radar', 'wishlist'],
              ].map(([label, key]) => [label, state.off.has(key) ? 'Off' : channelLink(FEATURE_CHANNELS[key])]),
              ['Idle radio', state.idle ? 'On' : 'Off'],
              ['Radio Night', state.night ? 'Friday 20:00' : 'Off', true],
            ]),
          })
        )
      );
    },

    // The real one counts this month from the bot's play log; this one counts what you played here.
    'setup wrapped-preview'() {
      const now = new Date();
      const month = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      const lines = [h('p', { class: 'wrapped-h2', text: '🎁 Kitchen Wrapped · ' + month })];
      const plays = state.plays;
      if (!plays.length) {
        lines.push(h('p', {}, h('i', { text: 'A quiet month. Nobody played a song, so there is nothing to wrap.' })));
      } else {
        if (now.getDate() > 1) lines.push(h('p', { class: 'board-sub', text: 'since ' + now.toLocaleString('en-GB', { day: 'numeric', month: 'long' }) }));
        const minutes = Math.round(plays.reduce((sum, title) => sum + lengthOf(title), 0) / 60);
        const length = minutes < 60 ? (minutes === 1 ? '1 minute' : minutes + ' minutes') : Math.round(minutes / 60) === 1 ? '1 hour' : Math.round(minutes / 60) + ' hours';
        const songs = plays.length === 1 ? '1 song' : plays.length + ' songs';
        lines.push(h('p', { class: 'board-h3', text: '🎵 What we played' }), h('p', {}, strong(songs), ' · ', strong(length), ' of music'));
        const counts = new Map();
        plays.forEach((title) => counts.set(title, (counts.get(title) || 0) + 1));
        const top = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 5);
        const medal = (i) => ['🥇', '🥈', '🥉'][i] || i + 1 + '.';
        lines.push(
          h('p', { class: 'board-h3', text: '🔝 On repeat' }),
          h('p', {}, top.map(([title, n], i) => [i ? h('br') : null, medal(i) + ' ', strong(title), ' · ' + (n === 1 ? '1 play' : n + ' plays')])),
          h('p', { class: 'board-h3', text: '🍪 Brought the most' }),
          h('p', {}, '🥇 ', strong('you'), ' · ' + songs)
        );
      }
      // A quiet month gets no sign-off, like the bot's.
      if (plays.length) lines.push(h('p', { class: 'board-sub wrapped-end', text: '🍪 See you next month' }));
      const card = embed({ bar: '#c4783a', children: lines });
      card.classList.add('wrapped');
      reply(() => botMessage(h('p', { class: 'dc-ephemeral', text: ui('radio.onlyYou', 'Only you can see this') }), card));
    },

    'setup kitchen'() {
      state.off.delete('kitchen');
      reply(() => botMessage(text('🍳 The Kitchen Board will live in ', channelLink('kitchen'), '. I’ll keep that one message up to date.')));
    },

    'setup idle-radio'() {
      state.idle = !state.idle;
      reply(() =>
        botMessage(
          text(
            state.idle
              ? '📻 Idle radio is on. A quiet queue fades into the last station.'
              : '🚪 Idle radio is off. I’ll leave after the idle timeout.'
          )
        )
      );
    },
  };

  function pickChoice(set, rest) {
    const value = rest.toLowerCase().trim();
    if (!value) return null;
    const items = CHOICES[set].items;
    return items.find((item) => item.key === value) || items.find((item) => item.name.toLowerCase().startsWith(value));
  }

  function pickStation(rest) {
    const value = rest.toLowerCase();
    if (/\bfm\b|kitchen/.test(value)) return 'fm';
    return Object.keys(STATIONS).find((key) => value && (value.includes(key) || STATIONS[key].name.toLowerCase().startsWith(value)));
  }

  function findCommand(body) {
    const lower = body.toLowerCase();
    return COMMANDS.slice()
      .sort((a, b) => b.name.length - a.name.length)
      .find((cmd) => lower === cmd.name || lower.startsWith(cmd.name + ' '));
  }

  function run(raw) {
    const value = raw.trim();
    if (!value) return;
    if (channel !== 'kitchen') showChannel('kitchen');
    closeMenu();

    if (!value.startsWith('/')) {
      const msg = append(userMessage(value.slice(0, 200)));
      later(() => {
        const body = msg.querySelector('.dc-body');
        body.append(h('p', { class: 'dc-reactions' }, h('span', {}, '🍪 ', h('b', { text: '1' }))));
        scrollDown();
      }, 700);
      input.value = '';
      return;
    }

    const body = value.slice(1);
    const cmd = findCommand(body);
    if (!cmd) {
      input.value = '';
      append(botMessage(...onlyYou('That’s not on the menu. Try ', h('code', { text: '/play' }), ' or ', h('code', { text: '/radio play' }), '.')));
      return;
    }

    const rest = body.slice(cmd.name.length).trim();
    const handled = handlers[cmd.name](rest);
    if (handled === false) return;
    input.value = '';
    append(usedLine('/' + cmd.name));
  }

  /* ---------- the server around the channel ---------- */

  // Dzbanek sits in the Lounge while it plays something, with the green ring while sound comes out.
  const voiceBot = document.querySelector('[data-demo-voice-bot]');
  function voice() {
    const busy = Boolean(state.track || state.radio || state.fm || state.quiz);
    voiceBot.hidden = !busy;
    voiceBot.classList.toggle('is-speaking', busy && !(state.track && state.paused));
  }
  if (voiceBot) setInterval(voice, 500);

  // The bot's real status: three lines, a new one every twenty minutes.
  const LORE = ['Purifying the source', 'Analyzing bacteria levels', 'Pouring fresh drops'];
  const status = document.querySelector('[data-demo-status]');
  if (status) status.textContent = LORE[Math.floor(new Date().getMinutes() / 20)];

  /* ---------- the other channels ---------- */

  // Only #kitchen takes commands; the rest show what the bot posts there, read-only.
  const TOPICS = {
    kitchen: ['demo.topic', 'A fake channel. Nothing here reaches Discord.'],
    welcome: ['demo.topicWelcome', 'Hi and bye, from Dzbanek'],
    'steam-deals': ['demo.topicSteam', 'Ten Steam deals every day at 03:33'],
    'epic-free': ['demo.topicEpic', 'Epic’s free games, checked at 12:00 and 17:00'],
    'wishlist-radar': ['demo.topicRadar', 'A ping when a game on your wishlist goes on sale'],
  };
  const channelName = root.querySelector('[data-demo-name]');
  const channelTopic = root.querySelector('[data-demo-topic]');
  const locked = root.querySelector('[data-demo-locked]');
  const panes = root.querySelectorAll('[data-demo-pane]');
  const channelButtons = document.querySelectorAll('[data-demo-channel]');
  let channel = 'kitchen';

  function showChannel(name) {
    channel = name;
    const kitchen = name === 'kitchen';
    channelButtons.forEach((button) => {
      const on = button.getAttribute('data-demo-channel') === name;
      button.classList.toggle('is-active', on);
      if (on) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    log.hidden = !kitchen;
    form.hidden = !kitchen;
    locked.hidden = kitchen;
    typing.hidden = !kitchen || state.thinking === 0;
    if (!kitchen) closeMenu();
    panes.forEach((pane) => {
      pane.hidden = pane.getAttribute('data-demo-pane') !== name;
      // Discord opens a channel at its newest message.
      if (!pane.hidden) pane.scrollTop = pane.scrollHeight;
    });
    if (kitchen) log.scrollTop = log.scrollHeight;
    channelName.textContent = name;
    const [key, fallback] = TOPICS[name];
    channelTopic.setAttribute('data-i18n', key);
    channelTopic.textContent = ui(key, fallback);
  }

  channelButtons.forEach((button) => {
    button.addEventListener('click', () => showChannel(button.getAttribute('data-demo-channel')));
  });

  /* ---------- the slash menu (combobox) ---------- */

  let items = [];
  let active = 0;
  let mode = 'cmd';
  let parent = null;

  function openWith(value) {
    touched = true;
    if (channel !== 'kitchen') showChannel('kitchen');
    input.value = value;
    input.focus({ preventScroll: true });
    refresh();
  }

  function closeMenu() {
    suggest.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    items = [];
  }

  function refresh() {
    const value = input.value;
    if (!value.startsWith('/')) return closeMenu();
    const body = value.slice(1).toLowerCase();

    const withChoices = COMMANDS.find((cmd) => cmd.choices && body.startsWith(cmd.name + ' '));
    if (withChoices) {
      const rest = body.slice(withChoices.name.length + 1).trim();
      mode = 'choice';
      parent = withChoices;
      const set = CHOICES[withChoices.choices];
      items = set.items.filter((item) => !rest || item.key.startsWith(rest) || item.name.toLowerCase().startsWith(rest));
      suggestHead.textContent = ui(...set.head);
    } else if (COMMANDS.some((cmd) => cmd.free && body.startsWith(cmd.name + ' '))) {
      return closeMenu();
    } else {
      mode = 'cmd';
      parent = null;
      const starts = COMMANDS.filter((cmd) => cmd.name.startsWith(body));
      const contains = COMMANDS.filter((cmd) => !cmd.name.startsWith(body) && cmd.name.includes(body));
      items = starts.concat(contains);
      suggestHead.textContent = ui('demo.matching', 'Commands matching') + ' /' + value.slice(1);
    }

    if (!items.length) return closeMenu();
    active = Math.min(active, items.length - 1);
    draw();
    suggest.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }

  function draw() {
    list.replaceChildren(
      ...items.map((item, index) => {
        const selected = index === active;
        const content =
          mode === 'cmd'
            ? [
                h('img', { src: AVATAR, alt: '', width: 26, height: 26 }),
                h(
                  'span',
                  {},
                  h('span', { class: 'dc-opt-name', text: '/' + item.name }),
                  item.args && h('span', { class: 'dc-opt-args', text: item.args }),
                  h('span', { class: 'dc-opt-desc', text: item.desc })
                ),
              ]
            : [
                h('span', { class: 'swatch', style: '--accent: ' + (item.color || 'var(--dc-muted)') }),
                h('span', {}, h('span', { class: 'dc-opt-name', text: item.name }), h('span', { class: 'dc-opt-desc', text: item.desc })),
              ];
        return h(
          'li',
          {
            id: 'demo-opt-' + index,
            class: 'dc-opt',
            role: 'option',
            'aria-selected': String(selected),
            onmousedown: (event) => event.preventDefault(),
            onclick: () => choose(index),
            onmousemove: () => {
              if (active !== index) {
                active = index;
                draw();
              }
            },
          },
          content
        );
      })
    );
    input.setAttribute('aria-activedescendant', 'demo-opt-' + active);
    list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }

  function choose(index) {
    const item = items[index];
    if (!item) return;
    if (mode === 'choice') {
      run('/' + parent.name + ' ' + item.key);
      return;
    }
    if (item.free || item.choices) {
      active = 0;
      openWith('/' + item.name + ' ');
      if (item.free) closeMenu();
      return;
    }
    run('/' + item.name);
  }

  input.addEventListener('input', () => {
    active = 0;
    refresh();
  });
  input.addEventListener('focus', refresh);
  input.addEventListener('blur', () => later(closeMenu, 120));

  input.addEventListener('keydown', (event) => {
    const open = !suggest.hidden && items.length > 0;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!open) {
        refresh();
        return;
      }
      event.preventDefault();
      active = (active + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      draw();
    } else if ((event.key === 'Enter' || event.key === 'Tab') && open) {
      event.preventDefault();
      choose(active);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      closeMenu();
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    run(input.value);
  });

  // "/" anywhere on the page jumps into the box, like Discord.
  document.addEventListener('keydown', (event) => {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target;
    if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
    event.preventDefault();
    openWith('/');
  });

  document.querySelectorAll('[data-demo-run]').forEach((chip) => {
    chip.addEventListener('click', () => run(chip.getAttribute('data-demo-run')));
  });

  document.querySelector('[data-demo-reset]')?.addEventListener('click', () => {
    timers.forEach((id) => clearTimeout(id));
    timers.clear();
    clearInterval(ticker);
    clearInterval(radioTimer);
    clearTimeout(quizTimer);
    state = fresh();
    typing.hidden = true;
    log.innerHTML = firstMessage;
    input.value = '';
    closeMenu();
    showChannel('kitchen');
  });

  window.addEventListener('dzbanek:lang', () => {
    if (!suggest.hidden) refresh();
  });

  /* ---------- the first look ---------- */

  // The first time the channel comes into view, "you" type /play, so a card is playing before anyone has to ask.
  // Not with reduced motion, and never once someone has used the box, a chip, a channel, or the reset.
  let typed = '';
  const takeOver = () => {
    if (touched) return;
    touched = true;
    if (typed && input.value === typed) {
      input.value = '';
      closeMenu();
    }
  };
  input.addEventListener('focus', takeOver);
  document.querySelectorAll('[data-demo-run], [data-demo-reset], [data-demo-channel]').forEach((el) => el.addEventListener('click', takeOver));

  function typeOut(command) {
    if (touched || channel !== 'kitchen') return;
    if (typed.length < command.length) {
      typed = command.slice(0, typed.length + 1);
      input.value = typed;
      refresh();
      later(() => typeOut(command), 120);
    } else {
      later(() => {
        if (touched) return;
        touched = true;
        run(command);
      }, 500);
    }
  }

  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!calm && 'IntersectionObserver' in window) {
    const watch = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        watch.disconnect();
        later(() => typeOut('/play'), 800);
      },
      { threshold: 0.6 }
    );
    watch.observe(root);
  }
})();
