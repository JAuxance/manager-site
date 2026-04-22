import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function initTheWork(reduced: boolean) {
  const section = document.querySelector<HTMLElement>("[data-work]");
  if (!section) return;

  const track = section.querySelector<HTMLElement>("[data-work-track]");
  if (!track) return;

  const currentEl = section.querySelector<HTMLElement>("[data-work-current]");
  const panels = track.querySelectorAll(".work__item:not(.work__intro)");
  const total = panels.length || 5;

  // Reduced motion : le CSS fait un fallback stack vertical, rien à piloter.
  if (reduced) return;

  // Distance horizontale à parcourir = overflow du track par rapport au viewport.
  const getDistance = () =>
    Math.max(0, track.scrollWidth - window.innerWidth);

  gsap.to(track, {
    x: () => -getDistance(),
    ease: "none",
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: () => `+=${getDistance()}`,
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (!currentEl) return;
        const idx = Math.max(1, Math.min(total, Math.ceil(self.progress * total)));
        const str = String(idx).padStart(2, "0");
        if (currentEl.textContent !== str) currentEl.textContent = str;
      },
    },
  });
}
