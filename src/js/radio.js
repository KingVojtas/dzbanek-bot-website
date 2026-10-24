/**
 * radio.html: the tuner dial, which plays the real stations (listen.js), what's on air
 * on each station card, and the Radio Night vote demo. Nothing here talks to the bot.
 * Vote result lines stay in English, the way the bot posts them.
 */
(function () {
  // The station list lives in listen.js, in the bot's /radio order.
  const STATIONS = (window.dzbanekRadio && window.dzbanekRadio.stations) || {};
  const name = (key) => (STATIONS[key] ? STATIONS[key].name : key);

  // Arrow keys move through a role="radiogroup", the selection follows focus.
  function radioGroup(buttons, attr, onPick) {
    buttons.forEach((button, index) => {
      button.addEventListener('click', () => onPick(button.getAttribute(attr)));
      button.addEventListener('keydown', (event) => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
        let to = null;
        if (step) to = (index + step + buttons.length) % buttons.length;
        else if (event.key === 'Home') to = 0;
        else if (event.key === 'End') to = buttons.length - 1;
        if (to === null) return;
        event.preventDefault();
        buttons[to].focus();
        onPick(buttons[to].getAttribute(attr));
      });
    });
  }

  function check(buttons, attr, key) {
    buttons.forEach((button) => {
      const on = button.getAttribute(attr) === key;
      button.setAttribute('aria-checked', String(on));
      button.tabIndex = on ? 0 : -1;
    });
  }

  /* ---------- tuner ---------- */

  const tuner = document.querySelector('[data-tuner]');
  if (tuner) {
    const presets = Array.from(tuner.querySelectorAll('[data-station]'));
    const cards = Array.from(tuner.querySelectorAll('[data-station-card]'));
    const labels = Array.from(tuner.querySelectorAll('.tuner-label[data-for]'));
    // The needle stops under each station's label on the dial.
    const POSITION = {};
    labels.forEach((label) => (POSITION[label.dataset.for] = label.style.getPropertyValue('--pos')));
    const listen = tuner.querySelector('[data-tuner-listen]');
    const listenLabel = tuner.querySelector('[data-tuner-listen-label]');
    const nowLine = tuner.querySelector('[data-tuner-now]');
    const radio = window.dzbanekRadio;
    const say = (key, fallback) => (window.t && window.t(key)) || fallback;
    let tuned = 'beat';
    let live = { station: null, state: 'off', song: null };

    function tune(key, remember) {
      if (!POSITION[key]) return;
      tuned = key;
      // Turning the dial while it plays changes the station.
      if (radio && live.station && live.station !== key) radio.play(key);
      tuner.style.setProperty('--tuned', 'var(--' + key + ')');
      tuner.style.setProperty('--needle', POSITION[key]);
      check(presets, 'data-station', key);
      cards.forEach((card) => {
        const on = card.getAttribute('data-station-card') === key;
        card.classList.toggle('is-tuned', on);
        card.classList.toggle('is-dim', !on);
      });
      labels.forEach((label) => label.classList.toggle('is-on', label.getAttribute('data-for') === key));
      if (remember) {
        const url = new URL(location.href);
        url.hash = key;
        history.replaceState(null, '', url);
      }
    }

    radioGroup(presets, 'data-station', (key) => tune(key, true));
    cards.forEach((card) => {
      card.addEventListener('click', (event) => {
        if (event.target.closest('a')) return;
        tune(card.getAttribute('data-station-card'), true);
      });
    });

    const fromHash = location.hash.slice(1);
    tune(POSITION[fromHash] ? fromHash : 'beat', false);

    /* listening: the button plays the tuned station */

    function showLive(info) {
      live = info;
      if (!listen) return;
      const on = Boolean(info.station);
      tuner.dataset.state = info.state;
      listen.setAttribute('aria-pressed', String(on));
      listenLabel.textContent = on ? say('tuner.stop', 'Stop') : say('tuner.listen', 'Listen live');
      const station = info.station ? name(info.station) : '';
      if (info.state === 'tuning') nowLine.textContent = say('radioLive.tuning', 'Tuning in…');
      else if (info.state === 'error') nowLine.textContent = say('radioLive.error', 'The station isn’t answering');
      else if (info.state === 'on')
        nowLine.textContent = info.song
          ? say('tuner.nowOn', 'Now on {{station}}:').replace('{{station}}', station) + ' ' + info.song.artist + ' – ' + info.song.title
          : say('radioLive.onAir', 'On air') + ' · ' + station;
      else nowLine.textContent = say('tuner.note', 'The real station, live. It’s the same stream the bot plays in Discord.');
    }

    if (radio && listen) {
      listen.addEventListener('click', () => (live.station ? radio.stop() : radio.play(tuned)));
      radio.onChange(showLive);
      window.addEventListener('dzbanek:lang', () => showLive(live));
    }

    /* what's on air on each card, refreshed while the page is open */

    async function onAir() {
      if (!radio || document.hidden) return;
      await Promise.all(
        cards.map(async (card) => {
          const line = card.querySelector('[data-station-now]');
          if (!line) return;
          const song = await radio.nowPlaying(card.getAttribute('data-station-card'));
          line.hidden = !song;
          if (song) line.textContent = say('tuner.onAirNow', 'On air now:') + ' ' + song.artist + ' – ' + song.title;
        })
      );
    }
    onAir();
    setInterval(onAir, 30000);
    document.addEventListener('visibilitychange', onAir);
    window.addEventListener('dzbanek:lang', onAir);
  }

  /* ---------- Radio Night vote ---------- */

  const vote = document.querySelector('[data-vote]');
  if (!vote) return;

  const rows = Array.from(vote.querySelectorAll('[data-tally]'));
  const KEYS = rows.map((row) => row.getAttribute('data-tally'));
  // A few neighbours already voted (the counts in the HTML). Kiss and Beat are level, so your vote decides.
  const SEED = {};
  rows.forEach((row) => (SEED[row.getAttribute('data-tally')] = Number(row.querySelector('.tally-count').textContent) || 0));
  const voteButtons = Array.from(vote.querySelectorAll('[data-vote-for]'));
  const schedButtons = Array.from(vote.querySelectorAll('[data-sched]'));
  const closeButton = vote.querySelector('[data-vote-close]');
  const result = vote.querySelector('[data-vote-result]');
  const resultText = vote.querySelector('[data-vote-result-text]');
  const totalLine = vote.querySelector('[data-vote-total]');

  let mine = null;
  let scheduled = 'beat';
  let closed = false;

  function counts() {
    const tally = Object.assign({}, SEED);
    if (mine) tally[mine] += 1;
    return tally;
  }

  // The bot's rules (src/kitchen/vote-tally.ts): the board crowns a leader only when one station is
  // ahead; at 20:00 the most votes win, and a tie goes to the scheduled station if it's among the tied,
  // otherwise to the first of them in /radio order.
  function leader(tally) {
    const top = Math.max(...KEYS.map((key) => tally[key]));
    const ahead = KEYS.filter((key) => tally[key] === top);
    return top > 0 && ahead.length === 1 ? ahead[0] : null;
  }

  function winner(tally) {
    const ranked = KEYS.slice().sort((a, b) => tally[b] - tally[a] || (a === scheduled ? -1 : b === scheduled ? 1 : 0));
    return tally[ranked[0]] > 0 ? ranked[0] : scheduled;
  }

  // The tally bar the bot draws in a code span: ten blocks, filled by share.
  const bar = (n, total) => {
    const filled = total > 0 ? Math.round((n / total) * 10) : 0;
    return '▰'.repeat(filled) + '▱'.repeat(10 - filled);
  };
  const short = (key) => (STATIONS[key] ? STATIONS[key].short : key);

  function render() {
    const tally = counts();
    const total = KEYS.reduce((sum, key) => sum + tally[key], 0);
    const ahead = leader(tally);
    const won = closed ? winner(tally) : null;
    rows.forEach((row) => {
      const key = row.getAttribute('data-tally');
      row.querySelector('.tally-bar').textContent = bar(tally[key], total);
      row.querySelector('.tally-count').textContent = String(tally[key]);
      row.classList.toggle('is-lead', key === ahead);
      row.classList.toggle('is-winner', key === won);
    });
    voteButtons.forEach((button) => {
      const key = button.getAttribute('data-vote-for');
      button.querySelector('.vote-n').textContent = String(tally[key]);
      button.classList.toggle('is-lead', key === ahead);
      button.setAttribute('aria-pressed', String(key === mine));
      button.disabled = closed;
    });
    if (totalLine) totalLine.textContent = total === 1 ? '1 vote so far' : total + ' votes so far';
    closeButton.disabled = closed;

    // The note the bot posts in the board's channel at 20:00.
    result.hidden = !closed;
    if (closed) {
      // Stations with at least one vote, in /radio order; no tally when nobody voted.
      const voted = KEYS.filter((key) => tally[key] > 0).map((key) => short(key) + ' ' + tally[key]);
      const votes = voted.length ? ' Vote: ' + voted.join(' · ') + '.' : '';
      resultText.replaceChildren(
        '🍪 ',
        Object.assign(document.createElement('strong'), { textContent: 'Radio Night' }),
        ' — ',
        Object.assign(document.createElement('strong'), { textContent: name(won) }),
        ' is live in ',
        Object.assign(document.createElement('strong'), { textContent: '#Radio corner' }),
        '. Hop in.' + votes
      );
    }
  }

  voteButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (closed) return;
      // One vote per person; pressing another station moves it.
      mine = button.getAttribute('data-vote-for');
      render();
    });
  });

  radioGroup(schedButtons, 'data-sched', (key) => {
    scheduled = key;
    check(schedButtons, 'data-sched', key);
    render();
  });

  closeButton.addEventListener('click', () => {
    closed = true;
    render();
  });

  vote.querySelector('[data-vote-reset]')?.addEventListener('click', () => {
    mine = null;
    closed = false;
    render();
  });

  render();
})();
