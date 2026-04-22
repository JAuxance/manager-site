/**
 * Scroll progress — met à jour une scaleX sur la barre fixe en haut.
 * Un seul listener passif + rAF throttled.
 */
export function initScrollProgress(reduced: boolean) {
  if (reduced) return;
  const el = document.querySelector<HTMLElement>("[data-scroll-progress] .sp__bar");
  if (!el) return;

  let raf = 0;
  const update = () => {
    raf = 0;
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    el.style.transform = `scaleX(${progress})`;
  };

  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(update);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();
}
