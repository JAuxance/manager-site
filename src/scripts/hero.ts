import { gsap } from "gsap";

export function initHero(reduced: boolean) {
  const hero = document.querySelector<HTMLElement>("[data-hero]");
  if (!hero) return;

  const logoWrap = hero.querySelector<HTMLElement>("[data-hero-logo-wrap]");
  const svg = hero.querySelector<SVGSVGElement>("[data-logo]");
  const bars = Array.from(hero.querySelectorAll<SVGRectElement>("[data-logo-bar]"));
  const diag = hero.querySelector<SVGLineElement>("[data-logo-diag]");
  const tagline = hero.querySelector<HTMLElement>("[data-reveal]");
  const actions = hero.querySelector<HTMLElement>("[data-reveal-actions]");
  const startCta = hero.querySelector<HTMLElement>("[data-reveal-start]");

  if (tagline) splitIntoWords(tagline);

  if (reduced) {
    // Respecte prefers-reduced-motion : pas d'intro, pas de parallaxe.
    return;
  }

  // ------- États initiaux -------
  gsap.set(bars, { transformOrigin: "50% 100%", scaleY: 0 });

  let diagLen = 620;
  if (diag && typeof diag.getTotalLength === "function") {
    diagLen = diag.getTotalLength();
  }
  if (diag) {
    diag.style.strokeDasharray = String(diagLen);
    diag.style.strokeDashoffset = String(diagLen);
  }

  const words = tagline
    ? Array.from(tagline.querySelectorAll<HTMLElement>(".reveal-word"))
    : [];
  if (words.length) gsap.set(words, { yPercent: 100, opacity: 0 });

  const ctaBtns = actions
    ? Array.from(actions.querySelectorAll<HTMLElement>(".hbtn"))
    : [];
  if (ctaBtns.length) gsap.set(ctaBtns, { y: 18, opacity: 0 });

  if (startCta) gsap.set(startCta, { y: 16, opacity: 0 });

  // ------- Timeline d'entrée — compressée (~1.6s) -------
  const tl = gsap.timeline({ delay: 0.18 });

  tl.to(bars, {
    scaleY: 1,
    duration: 0.75,
    ease: "expo.out",
    stagger: 0.07,
  });

  if (diag) {
    tl.to(
      diag,
      {
        strokeDashoffset: 0,
        duration: 0.7,
        ease: "power3.out",
      },
      "-=0.55"
    );
  }

  if (words.length) {
    tl.to(
      words,
      {
        yPercent: 0,
        opacity: 1,
        duration: 0.6,
        ease: "expo.out",
        stagger: 0.045,
      },
      "-=0.45"
    );
  }

  if (startCta) {
    tl.to(
      startCta,
      {
        y: 0,
        opacity: 1,
        duration: 0.55,
        ease: "expo.out",
      },
      "-=0.4"
    );
  }

  if (ctaBtns.length) {
    tl.to(
      ctaBtns,
      {
        y: 0,
        opacity: 1,
        duration: 0.55,
        ease: "expo.out",
        stagger: 0.05,
      },
      "-=0.35"
    );
  }

  // ------- Parallaxe 3D souris -------
  if (logoWrap && svg) {
    gsap.set(svg, {
      transformPerspective: 900,
      transformOrigin: "center center",
    });

    // Z-stagger : chaque barre à une profondeur différente
    bars.forEach((bar, i) => {
      gsap.set(bar, { z: (i - 1.5) * 10 });
    });

    const rotX = gsap.quickTo(svg, "rotationX", { duration: 0.45, ease: "power3.out" });
    const rotY = gsap.quickTo(svg, "rotationY", { duration: 0.45, ease: "power3.out" });

    window.addEventListener(
      "mousemove",
      (e: MouseEvent) => {
        const { innerWidth: w, innerHeight: h } = window;
        const dx = (e.clientX / w - 0.5) * 2; // -1 → 1
        const dy = (e.clientY / h - 0.5) * 2;
        rotY(dx * 6);
        rotX(-dy * 4);
      },
      { passive: true }
    );
  }
}

// ------- helpers -------

function splitIntoWords(root: HTMLElement) {
  // Évite de ré-envelopper si déjà fait
  if (root.dataset.revealReady === "1") return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) texts.push(n as Text);

  for (const t of texts) {
    const raw = t.textContent ?? "";
    const parts = raw.split(/(\s+)/);
    if (parts.length < 2 && raw.trim().length === 0) continue;

    const frag = document.createDocumentFragment();
    for (const p of parts) {
      if (p.length === 0) continue;
      if (/^\s+$/.test(p)) {
        frag.appendChild(document.createTextNode(p));
      } else {
        const span = document.createElement("span");
        span.className = "reveal-word";
        span.textContent = p;
        frag.appendChild(span);
      }
    }
    t.replaceWith(frag);
  }

  root.dataset.revealReady = "1";
}
