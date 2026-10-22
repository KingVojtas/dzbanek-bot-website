/**
 * Scroll reveals. [data-reveal] fades one element in; [data-reveal-group]
 * staggers its children. Without IntersectionObserver everything shows at once.
 *
 * Also pauses looping animations in blocks that are off-screen (.is-away),
 * so the page only animates what you can see.
 */
(function () {
  const canObserve = 'IntersectionObserver' in window;

  if (canObserve) {
    const away = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => entry.target.classList.toggle('is-away', !entry.isIntersecting));
      },
      { rootMargin: '120px 0px' }
    );
    document.querySelectorAll('.hero, .ticker, .section, .cta, .site-footer').forEach((el) => away.observe(el));
  }

  const items = document.querySelectorAll('[data-reveal], [data-reveal-group]');
  if (!items.length) return;

  document.querySelectorAll('[data-reveal-group]').forEach((group) => {
    Array.from(group.children).forEach((child, index) => {
      child.style.setProperty('--i', String(index));
    });
  });

  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (calm || !canObserve) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }

  // Start a little before the block scrolls in, so it has landed by the time you look.
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px 6% 0px', threshold: 0 }
  );

  items.forEach((el) => observer.observe(el));
})();
