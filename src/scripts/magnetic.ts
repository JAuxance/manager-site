import { gsap } from "gsap";

export function initMagnetic(reduced: boolean) {
  if (reduced) return;
  if (window.matchMedia("(hover: none)").matches) return;

  const buttons = document.querySelectorAll<HTMLElement>("[data-magnetic]");

  buttons.forEach((btn) => {
    const inner = btn.querySelector<HTMLElement>("[data-magnetic-inner]");
    const strength = 0.35;

    const xTo = gsap.quickTo(btn, "x", { duration: 0.5, ease: "power3.out" });
    const yTo = gsap.quickTo(btn, "y", { duration: 0.5, ease: "power3.out" });
    const ixTo = inner ? gsap.quickTo(inner, "x", { duration: 0.5, ease: "power3.out" }) : null;
    const iyTo = inner ? gsap.quickTo(inner, "y", { duration: 0.5, ease: "power3.out" }) : null;

    const onMove = (e: MouseEvent) => {
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width / 2) * strength;
      const dy = (e.clientY - r.top - r.height / 2) * strength;
      xTo(dx);
      yTo(dy);
      if (ixTo) ixTo(dx * 0.35);
      if (iyTo) iyTo(dy * 0.35);
    };

    btn.addEventListener("mouseenter", () => {
      btn.addEventListener("mousemove", onMove);
    });
    btn.addEventListener("mouseleave", () => {
      btn.removeEventListener("mousemove", onMove);
      xTo(0);
      yTo(0);
      if (ixTo) ixTo(0);
      if (iyTo) iyTo(0);
    });

    // Pression : le bouton acquiesce (en plus du x/y magnétique).
    // On anime `scale` via gsap pour ne pas entrer en conflit avec le transform
    // quickTo qui pilote x/y (gsap gère les sub-transforms sans écraser).
    const press = () => gsap.to(btn, { scale: 0.97, duration: 0.14, ease: "power3.out" });
    const release = () => gsap.to(btn, { scale: 1, duration: 0.22, ease: "power3.out" });
    btn.addEventListener("pointerdown", press, { passive: true });
    btn.addEventListener("pointerup", release, { passive: true });
    btn.addEventListener("pointercancel", release, { passive: true });
    btn.addEventListener("pointerleave", release, { passive: true });
  });
}
