const STORAGE_KEY = "manager.lang";
type Lang = "en" | "fr";

function applyLang(lang: Lang) {
  document.documentElement.setAttribute("lang", lang);
  document.querySelectorAll<HTMLButtonElement>("[data-lang-set]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.langSet === lang));
  });
}

export function initLangToggle() {
  // Init : localStorage (choix user) > 'en' par défaut strict.
  // Pas de détection navigateur — l'anglais est le default assumé.
  const stored = (typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY)) as Lang | null;
  const initial: Lang = stored ?? "en";
  applyLang(initial);

  document.querySelectorAll<HTMLButtonElement>("[data-lang-set]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = (btn.dataset.langSet ?? "en") as Lang;
      applyLang(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* localStorage indisponible, on continue */
      }
    });
  });
}
