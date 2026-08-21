import { initLangToggle } from "./lang-toggle";

document.documentElement.classList.add("js");

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

initLangToggle();

type SiteTheme = "dark" | "light";
const THEME_KEY = "manager.siteTheme";

function storedTheme(): SiteTheme | null {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === "dark" || value === "light" ? value : null;
  } catch {
    return null;
  }
}

function initSiteTheme() {
  const root = document.documentElement;
  const system = window.matchMedia("(prefers-color-scheme: light)");
  let transitionTimer = 0;

  const syncControls = (theme: SiteTheme) => {
    document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]").forEach((button) => {
      button.setAttribute("aria-pressed", String(theme === "light"));
      button.title = theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre";
    });
    document.querySelectorAll<HTMLButtonElement>("[data-theme-choice]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.themeChoice === theme));
    });
  };

  const apply = (theme: SiteTheme, persist = false, animate = false) => {
    if (animate && !reducedMotion) {
      root.classList.add("theme-transition");
      window.clearTimeout(transitionTimer);
      transitionTimer = window.setTimeout(() => root.classList.remove("theme-transition"), 480);
    }
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute(
      "content",
      theme === "light" ? "#f4f6fb" : "#05070d",
    );
    syncControls(theme);
    if (persist) {
      try { localStorage.setItem(THEME_KEY, theme); } catch { /* storage unavailable */ }
    }
  };

  const initial: SiteTheme = root.dataset.theme === "light" ? "light" : "dark";
  apply(initial);

  document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const next: SiteTheme = root.dataset.theme === "light" ? "dark" : "light";
      apply(next, true, true);
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-theme-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      const choice = button.dataset.themeChoice;
      if (choice === "dark" || choice === "light") apply(choice, true, true);
    });
  });

  system.addEventListener?.("change", (event) => {
    if (!storedTheme()) apply(event.matches ? "light" : "dark", false, true);
  });
}

function initNavigation() {
  const nav = document.querySelector<HTMLElement>("[data-site-nav]");
  if (!nav) return;
  const update = () => nav.classList.toggle("is-scrolled", window.scrollY > 18);
  update();
  window.addEventListener("scroll", update, { passive: true });
}

function initReveals() {
  const elements = document.querySelectorAll<HTMLElement>("[data-appear]");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -9%", threshold: 0.07 });

  elements.forEach((element) => observer.observe(element));
}

function initHeroMotion() {
  if (reducedMotion) return;
  const hero = document.querySelector<HTMLElement>("[data-hero]");
  const product = document.querySelector<HTMLElement>("[data-hero-product]");
  const visual = document.querySelector<HTMLElement>("[data-hero-visual]");
  const tilt = document.querySelector<HTMLElement>("[data-hero-tilt]");
  if (!hero || !product) return;

  let scrollQueued = false;
  const updateScroll = () => {
    scrollQueued = false;
    const progress = Math.min(1, Math.max(0, window.scrollY / Math.max(hero.offsetHeight, 1)));
    product.style.setProperty("--hero-shift", `${progress * 22}px`);
  };
  window.addEventListener("scroll", () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(updateScroll);
  }, { passive: true });

  if (!visual || !tilt || !window.matchMedia("(pointer: fine)").matches) return;
  visual.addEventListener("pointermove", (event) => {
    const rect = visual.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    tilt.style.setProperty("--tilt-y", `${x * 3.2}deg`);
    tilt.style.setProperty("--tilt-x", `${y * -2.2}deg`);
  });
  visual.addEventListener("pointerleave", () => {
    tilt.style.setProperty("--tilt-y", "0deg");
    tilt.style.setProperty("--tilt-x", "0deg");
  });
}

function initParallax() {
  if (reducedMotion) return;
  const scenes = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax-scene]"));
  if (!scenes.length) return;
  let queued = false;

  const update = () => {
    queued = false;
    scenes.forEach((scene) => {
      const rect = scene.getBoundingClientRect();
      const offset = rect.top + rect.height / 2 - window.innerHeight / 2;
      const ratio = Math.max(-1, Math.min(1, offset / window.innerHeight));
      scene.querySelectorAll<HTMLElement>("[data-parallax-layer]").forEach((layer) => {
        const speed = Number(layer.dataset.parallaxSpeed ?? 0);
        layer.style.setProperty("--layer-shift", `${(-ratio * speed).toFixed(2)}px`);
      });
    });
  };

  const requestUpdate = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };
  update();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate, { passive: true });
}

function initTour() {
  const root = document.querySelector<HTMLElement>("[data-tour]");
  if (!root) return;
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-tour-tab]"));
  const panels = Array.from(root.querySelectorAll<HTMLElement>("[data-tour-panel]"));

  const activate = (key: string, focus = false) => {
    tabs.forEach((tab) => {
      const active = tab.dataset.tourTab === key;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focus) tab.focus();
    });
    panels.forEach((panel) => {
      const active = panel.dataset.tourPanel === key;
      panel.classList.toggle("is-active", active);
      panel.setAttribute("aria-hidden", String(!active));
      panel.toggleAttribute("inert", !active);
    });
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activate(tab.dataset.tourTab ?? "focus"));
    tab.addEventListener("keydown", (event) => {
      let target = index;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") target = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") target = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") target = 0;
      else if (event.key === "End") target = tabs.length - 1;
      else return;
      event.preventDefault();
      activate(tabs[target].dataset.tourTab ?? "focus", true);
    });
  });

  activate(tabs.find((tab) => tab.classList.contains("is-active"))?.dataset.tourTab ?? "focus");
}

function initDownloads() {
  const ua = navigator.userAgent.toLowerCase();
  const platform = ua.includes("linux") && !ua.includes("android")
    ? "linux"
    : ua.includes("windows") ? "windows" : null;
  if (platform) document.querySelector<HTMLElement>(`[data-platform-card="${platform}"]`)?.classList.add("is-match");
}

initSiteTheme();
initNavigation();
initReveals();
initHeroMotion();
initParallax();
initTour();
initDownloads();
