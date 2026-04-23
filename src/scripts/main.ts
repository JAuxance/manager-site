import { initSmoothScroll } from "./lenis-bridge";
import { initHero } from "./hero";
import { initMagnetic } from "./magnetic";
import { initTheWork } from "./the-work";
import { initFocus } from "./focus";
import { initYourLog } from "./your-log";
import { initLangToggle } from "./lang-toggle";
import { initReveal } from "./reveal";
import { initScrollProgress } from "./scroll-progress";
import { initEasterEgg } from "./easter-egg";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Langue d'abord (EN par défaut, FR si navigator ou localStorage).
initLangToggle();

// Lenis + GSAP bridge d'abord (registerPlugin).
initSmoothScroll(reduced);

// Interactions.
initMagnetic(reduced);

// Sections.
initHero(reduced);
initTheWork(reduced);
initFocus(reduced);
initYourLog(reduced);

// Reveal universel sur tout [data-appear]. En dernier pour capter tout le DOM.
initReveal(reduced);

// Site-wide polish.
initScrollProgress(reduced);
initEasterEgg(reduced);
