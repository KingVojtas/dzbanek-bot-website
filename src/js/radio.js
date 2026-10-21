/**
 * radio.html: the tuner dial and the Radio Night vote demo.
 * Neither plays sound or talks to the bot. Vote result lines stay in English,
 * the way the bot posts them.
 */
(function () {
  const NAMES = { kiss: 'Kiss Radio', rock: 'Rock Radio', beat: 'Radio Beat' };
  const KEYS = Object.keys(NAMES);

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
    const POSITION = { kiss: '18%', rock: '50%', beat: '82%' };
    const presets = Array.from(tuner.querySelectorAll('[data-station]'));
    const cards = Array.from(tuner.querySelectorAll('[data-station-card]'));
    const labels = Array.from(tuner.querySelectorAll('.tuner-label[data-for]'));

    function tune(key, remember) {
      if (!POSITION[key]) return;
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
  }

  /* ---------- Radio Night vote ---------- */

  const vote = document.querySelector('[data-vote]');
  if (!vote) return;

  // A few neighbours already voted. Kiss and Beat are level, so your vote decides.
  const SEED = { kiss: 2, rock: 1, beat: 2 };
  const rows = Array.from(vote.querySelectorAll('[data-tally]'));
  const voteButtons = Array.from(vote.querySelectorAll('[data-vote-for]'));
  const schedButtons = Array.from(vote.querySelectorAll('[data-sched]'));
  const closeButton = vote.querySelector('[data-vote-close]');
  const result = vote.querySelector('[data-vote-result]');
  const resultText = vote.querySelector('[data-vote-result-text]');

  let mine = null;
  let scheduled = 'beat';
  let closed = false;

  function counts() {
    const tally = Object.assign({}, SEED);
    if (mine) tally[mine] += 1;
    return tally;
  }

  function winner(tally) {
    const top = Math.max(...KEYS.map((key) => tally[key]));
    const leaders = KEYS.filter((key) => tally[key] === top);
    // A tie goes to the scheduled station. (The bot falls back to the last
    // station that played, then Beat, but a scheduled night always has one.)
    return { key: leaders.length === 1 ? leaders[0] : scheduled || 'beat', leaders, top };
  }

  function list(keys) {
    const names = keys.map((key) => NAMES[key]);
    return names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] : names[0];
  }

  function render() {
    const tally = counts();
    const total = KEYS.reduce((sum, key) => sum + tally[key], 0);
    const won = closed ? winner(tally).key : null;
    rows.forEach((row) => {
      const key = row.getAttribute('data-tally');
      row.style.setProperty('--share', total ? (tally[key] / total) * 100 + '%' : '0%');
      row.querySelector('.tally-count').textContent = String(tally[key]);
      row.classList.toggle('is-winner', key === won);
    });
    voteButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.getAttribute('data-vote-for') === mine));
      button.disabled = closed;
    });
    closeButton.disabled = closed;

    result.hidden = !closed;
    if (closed) {
      const { key, leaders, top } = winner(tally);
      resultText.textContent =
        leaders.length === 1
          ? '🏆 ' + NAMES[key] + ' wins with ' + top + ' votes. It starts now in 🔊 Kitchen.'
          : '🤝 ' + list(leaders) + ' tied at ' + top + '. The scheduled station, ' + NAMES[key] + ', starts now in 🔊 Kitchen.';
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
