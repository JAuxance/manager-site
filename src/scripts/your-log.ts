import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function initYourLog(reduced: boolean) {
  const section = document.querySelector<HTMLElement>("[data-log]");
  if (!section) return;

  const entries = Array.from(
    section.querySelectorAll<HTMLElement>("[data-log-entry]")
  );
  if (entries.length === 0) return;

  if (reduced) {
    entries.forEach((e) => {
      e.style.opacity = "1";
      e.style.transform = "none";
    });
    return;
  }

  gsap.set(entries, { opacity: 0, y: 12 });

  gsap.to(entries, {
    opacity: 1,
    y: 0,
    ease: "power2.out",
    duration: 0.35,
    stagger: 0.18,
    scrollTrigger: {
      trigger: section,
      start: "top 70%",
      end: "bottom 60%",
      toggleActions: "play none none reverse",
    },
  });
}
