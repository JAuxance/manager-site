/**
 * Easter egg — 4 clics rapides sur le logo du footer.
 * À la 4e, les barres du logo oscillent (clin d'œil au tally qui se clôt)
 * et un aphorisme italique apparaît pendant 3s, puis s'efface.
 */
const MAX_DELAY = 1800; // ms entre les clics pour rester "rapide"
const QUOTES = {
  en: [
    "Day by day.",
    "Held.",
    "The series continues.",
    "Counted.",
  ],
  fr: [
    "Jour après jour.",
    "Tenu.",
    "La série continue.",
    "Compté.",
  ],
};

export function initEasterEgg(reduced: boolean) {
  const logo = document.querySelector<SVGSVGElement>(".sitefooter__logo svg");
  if (!logo) return;

  let count = 0;
  let lastClick = 0;

  logo.style.cursor = "pointer";
  logo.setAttribute("role", "button");
  logo.setAttribute("tabindex", "0");
  logo.setAttribute("aria-label", "Manager");

  const trigger = () => {
    if (reduced) {
      showQuote();
      return;
    }
    danceBars();
    showQuote();
  };

  const onClick = () => {
    const now = performance.now();
    if (now - lastClick > MAX_DELAY) count = 0;
    lastClick = now;
    count += 1;
    if (count >= 4) {
      count = 0;
      trigger();
    }
  };

  logo.addEventListener("click", onClick);
  logo.addEventListener("keydown", (e) => {
    const ke = e as KeyboardEvent;
    if (ke.key === "Enter" || ke.key === " ") {
      ke.preventDefault();
      onClick();
    }
  });

  function danceBars() {
    const bars = Array.from(logo.querySelectorAll<SVGRectElement>("rect"));
    bars.forEach((bar, i) => {
      bar.style.transformBox = "fill-box";
      bar.style.transformOrigin = "50% 100%";
      bar.animate(
        [
          { transform: "scaleY(1)" },
          { transform: "scaleY(0.25)" },
          { transform: "scaleY(1.15)" },
          { transform: "scaleY(1)" },
        ],
        {
          duration: 720,
          delay: i * 80,
          easing: "cubic-bezier(0.2, 0.7, 0.1, 1)",
        }
      );
    });
  }

  function showQuote() {
    const lang = (document.documentElement.lang || "en").toLowerCase().startsWith("fr")
      ? "fr"
      : "en";
    const pool = QUOTES[lang];
    const text = pool[Math.floor(Math.random() * pool.length)];

    let host = document.querySelector<HTMLElement>("[data-egg-quote]");
    if (!host) {
      host = document.createElement("div");
      host.setAttribute("data-egg-quote", "");
      host.setAttribute("aria-live", "polite");
      host.style.cssText = `
        position: fixed;
        left: 50%;
        bottom: 12vh;
        transform: translateX(-50%) translateY(16px);
        z-index: 80;
        font-family: var(--font-display, Georgia, serif);
        font-style: italic;
        font-weight: 200;
        font-size: clamp(1.75rem, 3vw + 1rem, 2.75rem);
        color: var(--ink, #1a1a1a);
        background: var(--paper, #f6f5f1);
        padding: 0.6em 1em;
        border: 1px solid var(--ink, #1a1a1a);
        opacity: 0;
        transition:
          opacity 420ms cubic-bezier(0.2, 0.7, 0.1, 1),
          transform 420ms cubic-bezier(0.2, 0.7, 0.1, 1);
        pointer-events: none;
        white-space: nowrap;
      `;
      document.body.appendChild(host);
    }
    host.textContent = text;

    requestAnimationFrame(() => {
      host!.style.opacity = "1";
      host!.style.transform = "translateX(-50%) translateY(0)";
    });

    window.setTimeout(() => {
      if (!host) return;
      host.style.opacity = "0";
      host.style.transform = "translateX(-50%) translateY(16px)";
    }, 2600);
  }
}
