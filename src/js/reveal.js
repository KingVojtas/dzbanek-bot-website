/**
 * Pauses looping animations in blocks that are off-screen (.is-away),
 * so the page only animates what you can see.
 */
(function () {
  if (!('IntersectionObserver' in window)) return;

  const away = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('is-away', !entry.isIntersecting));
    },
    { rootMargin: '120px 0px' }
  );
  document.querySelectorAll('.hero, .section, .site-footer').forEach((el) => away.observe(el));
})();
