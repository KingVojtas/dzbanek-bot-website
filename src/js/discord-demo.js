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

  const AVATAR = 'assets/avatar.jpg';
  const SPEED = 10; // one real second plays ten seconds of a song

  const STATIONS = {
    kiss: { name: 'Kiss Radio', short: 'Kiss', color: '#e30613', slogan: '...be happy!', url: 'https://www.kiss.cz/' },
    rock: { name: 'Rock Radio', short: 'Rock', color: '#c8102e', slogan: 'Rock je slušná muzika', url: 'https://rockovyradio.cz/' },
    beat: { name: 'Radio Beat', short: 'Beat', color: '#f5c400', slogan: 'První bigbít u nás', url: 'https://www.radiobeat.cz/' },
  };
  const ON_AIR = ['Example Artist — Example Song', 'Someone Else — Another Song', 'A Local Band — On the Air'];
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

  const COMMANDS = [
    { name: 'play', args: '[song or link]', desc: 'Play a YouTube or Spotify query', free: true },
    { name: 'queue', desc: 'Show the upcoming queue' },
    { name: 'stop', desc: 'Stop, clear the queue, and leave' },
    { name: 'remove', args: '[position]', desc: 'Drop one upcoming track', free: true },
    { name: 'radio play', args: '[station]', desc: 'Stream Kiss, Rock, or Beat', choices: ['kiss', 'rock', 'beat'] },
    { name: 'radio stop', desc: 'Turn the radio off' },
    { name: 'radio night', desc: 'Put Friday Radio Night on the calendar' },
    { name: 'radio night-off', desc: 'Take Radio Night off the calendar' },
    { name: 'setup status', desc: 'Show this server’s channels' },
    { name: 'setup kitchen', desc: 'Pick where the Kitchen Board hangs' },
    { name: 'setup idle-radio', desc: 'Fade into radio when the queue ends' },
  ];

  const LOOP_LABELS = ['Loop', 'Repeat', 'Queue'];

  let state;
  function fresh() {
    return {
      track: null, // { title, length, elapsed }
      queue: [],
      paused: false,
      loop: 0,
      card: null,
      radio: null, // { key, card, song }
      lastStation: 'beat',
      night: false,
      idle: true,
      thinking: 0,
    };
  }
  state = fresh();

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
      rows.map(([name, value, wide]) => h('div', { class: wide ? 'wide' : null }, h('dt', { text: name }), h('dd', { text: value })))
    );
  }

  function button(label, onClick, { red = false, disabled = false } = {}) {
    return h('button', { type: 'button', class: 'dc-btn' + (red ? ' dc-btn-red' : ''), disabled, onclick: onClick, text: label });
  }

  function row(...buttons) {
    return h('div', { class: 'dc-row' }, buttons);
  }

  // Bot replies arrive after a short "thinking" beat, like a deferred interaction.
  function reply(build, delay = 650) {
    state.thinking += 1;
    typing.hidden = false;
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
      loopBtn.classList.toggle('is-on', state.loop > 0);
    });
    loopBtn.classList.toggle('is-on', state.loop > 0);

    const pauseBtn = button(state.paused ? 'Resume' : 'Pause', () => {
      state.paused = !state.paused;
      pauseBtn.textContent = state.paused ? 'Resume' : 'Pause';
      card.classList.toggle('paused', state.paused);
    });

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
        footer: state.queue.length ? state.queue.length + ' up next' : 'Nothing up next',
        thumb: h('div', { class: 'dc-embed-thumb vinyl', 'aria-hidden': 'true' }, h('span')),
      }),
      row(
        pauseBtn,
        button('Skip', skip),
        button('Stop', () => stopAll('⏹️ Stopped. The queue is cleared and I’ve left the channel.'), { red: true }),
        loopBtn,
        button('Shuffle', shuffle)
      )
    );
    card.classList.toggle('paused', state.paused);
    return card;
  }

  // Starting a new song clears the old Now Playing card.
  function startTrack(title) {
    retire(state.card);
    state.track = { title, length: lengthOf(title), elapsed: 0 };
    state.paused = false;
    state.card = append(nowPlaying());
    clearInterval(ticker);
    ticker = setInterval(tick, 250);
  }

  function refreshFooter() {
    const footer = state.card && state.card.querySelector('.dc-embed-footer');
    if (footer) footer.textContent = state.queue.length ? state.queue.length + ' up next' : 'Nothing up next';
  }

  function finish() {
    const done = state.track.title;
    if (state.loop === 1) {
      state.track.elapsed = 0;
      return;
    }
    if (state.loop === 2) state.queue.push(done);
    if (state.queue.length) {
      startTrack(state.queue.shift());
      return;
    }
    clearInterval(ticker);
    retire(state.card);
    state.card = null;
    state.track = null;
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
    const had = state.track || state.radio;
    stopMusic();
    stopRadio();
    if (message && had) append(botMessage(text(message)));
  }

  /* ---------- radio ---------- */

  let radioTimer = 0;

  function radioCard(key) {
    const station = STATIONS[key];
    const song = h('p', { class: 'dc-embed-title', text: ON_AIR[0] });
    const edited = h('span', { class: 'dc-muted' });
    const card = botMessage(
      embed({
        bar: station.color,
        author: [h('span', { class: 'live-dot', 'aria-hidden': 'true' }), ' Live · ' + station.name],
        children: [song, h('p', { class: 'dc-embed-desc' }, h('em', { text: station.slogan }), ' ', edited)],
        footer: 'Edits itself when the song on air changes',
      }),
      row(
        button('Stop', () => {
          if (stopRadio()) append(botMessage(text('📻 Radio off.')));
        }, { red: true }),
        h('a', { class: 'dc-btn', href: station.url, target: '_blank', rel: 'noopener noreferrer', text: 'Website ↗' }),
        button('Catch', () => catchSong(song.textContent))
      )
    );
    return { card, song, edited };
  }

  function startRadio(key, quiet) {
    if (state.track) {
      stopMusic();
      if (!quiet) append(botMessage(text('🎶 Music handed the speaker to the radio.')));
    }
    if (state.radio) retire(state.radio.card);
    const made = radioCard(key);
    state.radio = { key, card: append(made.card), index: 0 };
    state.lastStation = key;
    clearInterval(radioTimer);
    radioTimer = setInterval(() => {
      if (!state.radio) return;
      state.radio.index = (state.radio.index + 1) % ON_AIR.length;
      made.song.textContent = ON_AIR[state.radio.index];
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

  function catchSong(song) {
    const play = button('Play', () => {
      play.disabled = true;
      run('/play ' + song);
    });
    append(botMessage(...onlyYou('🎣 Caught ', strong(song), '. Press Play to queue it.'), row(play)));
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
        if (!state.track && !state.radio) return botMessage(...onlyYou('Nothing is playing.'));
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
        startRadio(key);
        return null;
      });
    },

    'radio stop'() {
      reply(() => (stopRadio() ? botMessage(text('📻 Radio off.')) : botMessage(...onlyYou('The radio isn’t on.'))));
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

    'setup status'() {
      reply(() =>
        botMessage(
          embed({
            bar: 'var(--clay)',
            author: '⚙️ Setup',
            title: 'Example Server',
            children: fields([
              ['Steam', '#steam-deals'],
              ['Epic', '#free-games'],
              ['Welcome', '#welcome'],
              ['Goodbye', '#goodbye'],
              ['Kitchen Board', '#kitchen'],
              ['Idle radio', state.idle ? 'On' : 'Off'],
              ['Radio Night', state.night ? 'Friday 20:00' : 'Off', true],
            ]),
          })
        )
      );
    },

    'setup kitchen'() {
      reply(() => botMessage(text('🍳 The Kitchen Board now hangs in ', h('span', { class: 'dc-mention', text: '#kitchen' }), '. It edits itself from here on.')));
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

  function pickStation(rest) {
    const value = rest.toLowerCase();
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

  /* ---------- the slash menu (combobox) ---------- */

  let items = [];
  let active = 0;
  let mode = 'cmd';
  let parent = null;

  function openWith(value) {
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
      items = withChoices.choices.filter((key) => !rest || key.startsWith(rest) || STATIONS[key].name.toLowerCase().startsWith(rest));
      suggestHead.textContent = ui('demo.station', 'station');
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
                h('span', { class: 'swatch', style: '--accent: ' + STATIONS[item].color }),
                h('span', {}, h('span', { class: 'dc-opt-name', text: STATIONS[item].name }), h('span', { class: 'dc-opt-desc', text: STATIONS[item].slogan })),
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
      run('/' + parent.name + ' ' + item);
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
    state = fresh();
    typing.hidden = true;
    log.innerHTML = firstMessage;
    input.value = '';
    closeMenu();
  });

  window.addEventListener('dzbanek:lang', () => {
    if (!suggest.hidden) refresh();
  });
})();
