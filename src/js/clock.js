/**
 * The kitchen clock. Reads the wall time in Europe/Prague and finds the next
 * scheduled thing the bot does. Nothing here talks to the bot.
 *
 * [data-clock="time"]       Prague HH:MM
 * [data-clock="stamp"]      "Today at HH:MM" in the viewer's own time, like Discord
 * [data-clock="next-name"]  the next event's name
 * [data-clock="next-in"]    how long until it
 * [data-clock="night-in"]   how long until Friday Radio Night
 * [data-clock-in="steam"]   how long until the next event with that id
 * [data-clock-face="epic"]  a small clock set to one time (data-at, minutes); the next of its id gets .is-next
 * [data-clock-event]        footer rows; the next one gets .is-next
 * [data-phase]              radio timeline rows; the current one gets .is-now on Fridays
 */
(function () {
  const ZONE = 'Europe/Prague';
  const DAY = 24 * 60;

  // day: 0 = Sunday … 6 = Saturday, null = every day. at: minutes after midnight.
  const EVENTS = [
    { id: 'steam', day: null, at: 3 * 60 + 33 },
    { id: 'epic', day: null, at: 12 * 60 },
    { id: 'epic', day: null, at: 17 * 60 },
    { id: 'vote', day: 5, at: 12 * 60 },
    { id: 'night', day: 5, at: 20 * 60 },
    { id: 'postcard', day: 0, at: 18 * 60 },
  ];

  const WEEKDAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const format = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONE,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
  });

  function pragueNow(date = new Date()) {
    const parts = {};
    format.formatToParts(date).forEach((part) => {
      parts[part.type] = part.value;
    });
    return {
      day: WEEKDAYS[parts.weekday],
      minutes: (Number(parts.hour) % 24) * 60 + Number(parts.minute),
      seconds: Number(parts.second),
    };
  }

  // The soonest event strictly after `now`, with `wait` in minutes.
  function nextOf(now, only) {
    let best = null;
    for (let offset = 0; offset <= 7; offset += 1) {
      const day = (now.day + offset) % 7;
      EVENTS.forEach((event) => {
        if (only && event.id !== only) return;
        if (event.day !== null && event.day !== day) return;
        const wait = offset * DAY + event.at - now.minutes;
        if (wait > 0 && (!best || wait < best.wait)) best = { id: event.id, at: event.at, wait };
      });
    }
    return best;
  }

  const pad = (n) => String(n).padStart(2, '0');
  const hhmm = (minutes) => pad(Math.floor(minutes / 60)) + ':' + pad(minutes % 60);

  function text(key, fallback, values) {
    let out = (window.t && window.t(key)) || fallback;
    Object.entries(values || {}).forEach(([name, value]) => {
      out = out.replace('{{' + name + '}}', String(value));
    });
    return out;
  }

  function countdown(wait) {
    const d = Math.floor(wait / DAY);
    const h = Math.floor((wait % DAY) / 60);
    const m = wait % 60;
    if (d > 0) return text('clock.inDays', 'in {{d}} d {{h}} h', { d, h });
    if (h > 0 && m === 0) return text('clock.inH', 'in {{h}} h', { h });
    if (h > 0) return text('clock.inHours', 'in {{h}} h {{m}} min', { h, m });
    return text('clock.inMin', 'in {{m}} min', { m: Math.max(1, m) });
  }

  function setAll(selector, value) {
    document.querySelectorAll(selector).forEach((el) => {
      if (el.textContent !== value) el.textContent = value;
    });
  }

  function render() {
    const now = pragueNow();
    const next = nextOf(now);
    const night = nextOf(now, 'night');

    setAll('[data-clock="time"]', hhmm(now.minutes));

    const local = new Date();
    setAll(
      '[data-clock="stamp"]',
      text('clock.today', 'Today at {{time}}', { time: pad(local.getHours()) + ':' + pad(local.getMinutes()) })
    );

    if (next) {
      setAll('[data-clock="next-name"]', text('clock.ev.' + next.id, next.id));
      setAll('[data-clock="next-in"]', countdown(next.wait));
      document.querySelectorAll('[data-clock-event]').forEach((row) => {
        row.classList.toggle('is-next', row.getAttribute('data-clock-event') === next.id);
      });
    }
    if (night) setAll('[data-clock="night-in"]', countdown(night.wait));

    document.querySelectorAll('[data-clock-in]').forEach((el) => {
      const soon = nextOf(now, el.getAttribute('data-clock-in'));
      const value = soon ? countdown(soon.wait) : '';
      if (el.textContent !== value) el.textContent = value;
    });
    document.querySelectorAll('[data-clock-face]').forEach((face) => {
      const soon = nextOf(now, face.getAttribute('data-clock-face'));
      face.classList.toggle('is-next', Boolean(soon) && soon.at === Number(face.getAttribute('data-at')));
    });

    let phase = null;
    if (now.day === 5 && now.minutes >= 12 * 60) phase = now.minutes < 20 * 60 ? 'vote' : 'night';
    document.querySelectorAll('[data-phase]').forEach((row) => {
      const on = row.getAttribute('data-phase') === phase;
      row.classList.toggle('is-now', on);
      if (on) row.setAttribute('data-now', text('clock.now', 'Now'));
    });
  }

  window.DZBANEK_CLOCK = { pragueNow, nextOf, countdown };

  render();
  setInterval(render, 15000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) render();
  });
  window.addEventListener('dzbanek:lang', render);
})();
