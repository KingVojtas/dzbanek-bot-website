/**
 * What's new: filters the kitchen log by kind (new, better, fix), with a count on each button.
 * Without JS the filter stays hidden and the whole log shows.
 */
(function () {
  const filter = document.querySelector('[data-log-filter]');
  const log = document.querySelector('.log');
  if (!filter || !log) return;

  const rows = Array.from(log.querySelectorAll('.log-day li'));
  const kindOf = (row) => {
    const tag = row.querySelector('.log-kind');
    if (!tag) return 'tweak';
    if (tag.classList.contains('is-new')) return 'new';
    if (tag.classList.contains('is-fix')) return 'fix';
    return 'tweak';
  };
  const buttons = Array.from(filter.querySelectorAll('[data-kind]'));

  buttons.forEach((button) => {
    const kind = button.dataset.kind;
    const count = kind === 'all' ? rows.length : rows.filter((row) => kindOf(row) === kind).length;
    button.querySelector('[data-count]').textContent = String(count);
    button.addEventListener('click', () => {
      buttons.forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
      rows.forEach((row) => {
        row.hidden = kind !== 'all' && kindOf(row) !== kind;
      });
      // A day with nothing left on it goes too.
      log.querySelectorAll('.log-day').forEach((day) => {
        day.hidden = !day.querySelector('li:not([hidden])');
      });
    });
  });

  filter.hidden = false;
})();
