/**
 * index.html: the contents beside the chapters. The chapter you're reading
 * gets aria-current, so the dot follows you down the page.
 * Without scripts the contents are plain links.
 */
(function () {
  const contents = document.querySelector('[data-contents]');
  if (!contents || !('IntersectionObserver' in window)) return;

  const links = new Map();
  contents.querySelectorAll('a[href^="#"]').forEach((link) => {
    const chapter = document.getElementById(link.getAttribute('href').slice(1));
    if (chapter) links.set(chapter, link);
  });

  const mark = (chapter) => {
    links.forEach((link, key) => {
      if (key === chapter) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  };

  // A chapter counts as open while it crosses a line a third of the way down the screen.
  // Back up on the title page, none is.
  const first = links.keys().next().value;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) mark(entry.target);
        else if (entry.target === first && entry.boundingClientRect.top > 0) mark(null);
      });
    },
    { rootMargin: '-33% 0px -66% 0px' }
  );

  links.forEach((_, chapter) => observer.observe(chapter));
})();
