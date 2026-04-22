import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const DAYS = 30;

export function initCountTheDays(reduced: boolean) {
  const section = document.querySelector<HTMLElement>("[data-count]");
  if (!section) return;

  const board = section.querySelector<HTMLElement>("[data-count-board]");
  const fills = Array.from(
    section.querySelectorAll<HTMLElement>("[data-count-sq] .count__sq-fill")
  );
  const doneEl = section.querySelector<HTMLElement>("[data-count-done]");

  if (!board || fills.length === 0) return;

  // Reduced motion : tout rempli d'un coup.
  if (reduced) {
    fills.forEach((f) => (f.style.transform = "scaleY(1)"));
    if (doneEl) doneEl.textContent = String(DAYS);
    return;
  }

  gsap.set(fills, { scaleY: 0 });

  const counter = { val: 0 };

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "+=150%",
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });

  // Chaque case se remplit en ~0.08 de la timeline totale, stagger sur 0→0.9
  tl.to(
    fills,
    {
      scaleY: 1,
      duration: 0.08,
      ease: "power2.out",
      stagger: 0.9 / (DAYS - 1),
    },
    0
  );

  // Compteur 0 → 30 synchronisé
  tl.to(
    counter,
    {
      val: DAYS,
      duration: 1,
      ease: "none",
      onUpdate: () => {
        if (doneEl) doneEl.textContent = String(Math.floor(counter.val));
      },
    },
    0
  );
}
