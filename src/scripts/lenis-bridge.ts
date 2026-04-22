import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function registerGsap() {
  gsap.registerPlugin(ScrollTrigger);
}

export function initSmoothScroll(reduced: boolean): Lenis | null {
  registerGsap();
  if (reduced) return null;

  const html = document.documentElement;
  html.classList.add("lenis", "lenis-smooth");

  const lenis = new Lenis({
    duration: 1.1,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time: number) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  return lenis;
}
