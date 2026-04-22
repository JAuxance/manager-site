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
  const freeBadge = hero.querySelector<HTMLElement>("[data-reveal-free]");
  // Badges fixed en dehors du Hero mais qui doivent arriver en même temps
  // que les CTAs de l'intro.
  const github = document.querySelector<HTMLElement>(".gh");
  const langFixed = document.querySelector<HTMLElement>(".lang-fixed");

  if (tagline) splitIntoWords(tagline);

  if (reduced) {
    // Respecte prefers-reduced-motion : pas d'intro, pas de parallaxe.
    // Le CSS @media prefers-reduced-motion ré-affiche les barres.
    logoWrap?.classList.add("is-ready");
    github?.classList.add("is-ready");
    langFixed?.classList.add("is-ready");
    return;
  }

  // ------- États initiaux -------
  // Chaque barre part au-delà du bord du viewport. On calcule un offset en
  // CSS px qui garantit que même les barres intérieures (2, 3) — proches du
  // centre à leur position finale — finissent hors-cadre au départ. Ce
  // minimum est `innerWidth * 0.65` (avec un plancher de 850px pour les
  // petits viewports). Les extérieures (1, 4) partent 200px plus loin encore
  // pour préserver l'effet de convergence en serrage.
  // Conversion CSS px → unité SVG via le ratio de rendu de l'SVG (viewBox
  // 1024 vs largeur affichée).
  const svgRect = svg?.getBoundingClientRect();
  const pxPerUnit = svgRect && svgRect.width > 0 ? svgRect.width / 1024 : 0.4;
  const nearPx = Math.max(window.innerWidth * 0.65, 850);
  const farPx  = nearPx + 200;
  const farU   = farPx / pxPerUnit;
  const nearU  = nearPx / pxPerUnit;
  const offsets = [-farU, -nearU, nearU, farU];

  // Les barres démarrent transparentes ET hors-cadre. L'opacité se lève au
  // fur et à mesure du mouvement — elles "se matérialisent" pendant la
  // glissade, sans apparition brutale à l'entrée de viewport.
  gsap.set(bars, { transformOrigin: "50% 100%", scaleY: 1, opacity: 0 });
  bars.forEach((bar, i) => {
    gsap.set(bar, { x: offsets[i] });
  });
  if (diag) gsap.set(diag, { opacity: 0 });

  // Les offsets off-screen sont posés → on peut réafficher le wrap sans flash.
  logoWrap?.classList.add("is-ready");

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
  if (freeBadge) gsap.set(freeBadge, { y: 12, opacity: 0 });

  // Badges fixed — même départ que les CTAs du hero.
  if (github) gsap.set(github, { y: -16, opacity: 0 });
  if (langFixed) gsap.set(langFixed, { y: -16, opacity: 0 });
  github?.classList.add("is-ready");
  langFixed?.classList.add("is-ready");

  // ------- Timeline d'entrée — bars depuis les bords -------
  const tl = gsap.timeline({ delay: 0.2 });

  // Les barres glissent depuis les bords du viewport. Stagger "edges" :
  // extérieures (1, 4) partent en premier, intérieures (2, 3) suivent —
  // convergence douce vers le centre. Ease `expo.out` pour une décélération
  // longue et soyeuse (plutôt qu'un claquement).
  // L'opacity monte en parallèle mais sur une ease différente (power2) et
  // une durée plus courte, pour que les barres "se densifient" avant
  // d'atteindre leur position finale — sensation de matérialisation.
  tl.to(bars, {
    x: 0,
    duration: 1.35,
    ease: "expo.out",
    stagger: { each: 0.11, from: "edges" },
  }, 0);

  tl.to(bars, {
    opacity: 1,
    duration: 0.95,
    ease: "power2.out",
    stagger: { each: 0.11, from: "edges" },
  }, 0);

  if (diag) {
    tl.to(
      diag,
      {
        strokeDashoffset: 0,
        opacity: 1,
        duration: 0.9,
        ease: "power2.out",
      },
      "-=0.7"
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

  // Le badge "Free" arrive juste avant les CTAs download — petite avance
  // pour que l'œil le voie puis descende sur le CTA.
  if (freeBadge) {
    tl.to(
      freeBadge,
      {
        y: 0,
        opacity: 1,
        duration: 0.45,
        ease: "expo.out",
      },
      "-=0.35"
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
      "-=0.2"
    );
  }

  // GitHub badge + LangToggle — descendent depuis le haut en parallèle des
  // download CTAs. `<` signifie "démarre au même moment que le tween précédent".
  const badges = [langFixed, github].filter((b): b is HTMLElement => !!b);
  if (badges.length) {
    tl.to(
      badges,
      {
        y: 0,
        opacity: 1,
        duration: 0.55,
        ease: "expo.out",
        stagger: 0.08,
      },
      "<"
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
