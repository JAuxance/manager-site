import { gsap } from "gsap";

export function initCursor(reduced: boolean) {
  if (reduced) return;
  if (window.matchMedia("(hover: none)").matches) return;

  const cursor = document.querySelector<HTMLElement>("[data-cursor]");
  if (!cursor) return;

  document.documentElement.classList.add("has-custom-cursor");

  const xTo = gsap.quickTo(cursor, "x", { duration: 0.22, ease: "power3.out" });
  const yTo = gsap.quickTo(cursor, "y", { duration: 0.22, ease: "power3.out" });

  let isReady = false;
  window.addEventListener(
    "mousemove",
    (e: MouseEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
      if (!isReady) {
        cursor.classList.add("is-ready");
        isReady = true;
      }
    },
    { passive: true }
  );

  const interactiveSelector = 'a, button, [data-magnetic], [role="button"]';

  document.addEventListener("mouseover", (e: MouseEvent) => {
    const target = e.target as Element | null;
    const matches = !!target?.closest?.(interactiveSelector);
    cursor.classList.toggle("is-interactive", matches);
  });

  // Pression : le ring acquiesce
  document.addEventListener("pointerdown", () => cursor.classList.add("is-pressed"), {
    passive: true,
  });
  const releasePress = () => cursor.classList.remove("is-pressed");
  document.addEventListener("pointerup", releasePress, { passive: true });
  document.addEventListener("pointercancel", releasePress, { passive: true });

  window.addEventListener("mouseleave", () => {
    cursor.classList.remove("is-ready");
    isReady = false;
  });
}
