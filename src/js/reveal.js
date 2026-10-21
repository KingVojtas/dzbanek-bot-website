/**
 * Scroll reveals. [data-reveal] fades one element in; [data-reveal-group]
 * staggers its children. Without IntersectionObserver everything shows at once.
 */
(function () {
  const items = document.querySelectorAll('[data-reveal], [data-reveal-group]');
  if (!items.length) return;

  document.querySelectorAll('[data-reveal-group]').forEach((group) => {
    Array.from(group.children).forEach((child, index) => {
      child.style.setProperty('--i', String(index));
    });
  });

  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (calm || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );

  items.forEach((el) => observer.observe(el));
})();
