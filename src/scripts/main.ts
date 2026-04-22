import { initSmoothScroll } from "./lenis-bridge";
import { initHero } from "./hero";
import { initCursor } from "./cursor";
import { initMagnetic } from "./magnetic";
import { initCountTheDays } from "./count-the-days";
import { initTheWork } from "./the-work";
import { initFocus } from "./focus";
import { initYourLog } from "./your-log";
import { initLangToggle } from "./lang-toggle";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Langue d'abord (EN par défaut, FR si navigator ou localStorage).
initLangToggle();

// Lenis + GSAP bridge d'abord (registerPlugin).
initSmoothScroll(reduced);

// Curseur custom.
initCursor(reduced);

// Interactions.
initMagnetic(reduced);

// Sections.
initHero(reduced);
initTheWork(reduced);
initCountTheDays(reduced);
initFocus(reduced);
initYourLog(reduced);
