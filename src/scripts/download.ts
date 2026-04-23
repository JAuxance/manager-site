/* ============================================================================
   download.ts — helpers client-side pour les CTAs de téléchargement.

   1. OS detection :
      a. GetStarted (§ 06) : pose data-os-match="1" sur le CTA correspondant,
         tous les CTAs restent visibles (c'est la section "guide complet").
      b. Hero : pose data-os-known="win|linux|mac" sur le container — CSS
         masque les CTAs non-matching pour ne laisser qu'un seul bouton
         dédié à l'OS du visiteur. Révèle aussi "See all platforms →".

   2. Mobile guard : affiche un message "Desktop-only" sur pointer coarse.

   3. Post-click toast : après un clic .exe ou .deb, affiche un toast
      structuré (titre · filename · 1-2 steps). Auto-dismiss 7s.
   ========================================================================= */

type OS = "win" | "mac" | "linux" | "other";
type Lang = "en" | "fr";

function detectOS(): OS {
  // @ts-ignore — userAgentData (Chromium 90+) n'est pas typé partout.
  const uaData = (navigator as any).userAgentData;
  const platform: string = (uaData?.platform ?? navigator.platform ?? "").toLowerCase();
  const ua = navigator.userAgent.toLowerCase();

  if (platform.includes("win") || ua.includes("windows")) return "win";
  if (platform.includes("mac") || ua.includes("mac os") || ua.includes("macintosh")) return "mac";
  if (platform.includes("linux") || ua.includes("linux")) return "linux";
  return "other";
}

function isMobile(): boolean {
  const coarse  = window.matchMedia("(pointer: coarse)").matches;
  const noHover = window.matchMedia("(hover: none)").matches;
  const narrow  = window.innerWidth < 720;
  return coarse && noHover && narrow;
}

function currentLang(): Lang {
  return document.documentElement.getAttribute("lang") === "fr" ? "fr" : "en";
}

/* --- OS lock : pose data-os-known sur les containers Hero + GetStarted.
   CSS masque ensuite les CTAs non-matching et promeut le bon en primary.
   Révèle aussi les escape hatches ("See all platforms" / "Need another OS?").
   ---------------------------------------------------------------------- */
function lockOS(os: OS) {
  if (os === "other") return;

  // Hero — 1 seul bouton visible
  const heroActions = document.querySelector<HTMLElement>("[data-hero-actions]");
  if (heroActions) heroActions.dataset.osKnown = os;
  const heroOther = document.querySelector<HTMLElement>("[data-hero-other]");
  if (heroOther) heroOther.dataset.heroOtherShow = "1";

  // GetStarted — même logique, plus un lien vers GitHub releases
  const gsDls = document.querySelector<HTMLElement>("[data-gs-dls]");
  if (gsDls) gsDls.dataset.osKnown = os;
  const gsOther = document.querySelector<HTMLElement>("[data-gs-dls-other]");
  if (gsOther) gsOther.dataset.show = "1";
}

function showMobileDesktopOnly() {
  document.querySelectorAll<HTMLElement>("[data-desktop-only]").forEach((el) => {
    el.dataset.show = "1";
  });
}

/* --- 3 : Toast --------------------------------------------------------- */

interface ToastEl extends HTMLElement {
  _t?: number;
}

function createToast(): ToastEl {
  const el = document.createElement("div") as ToastEl;
  el.className = "dl-toast";
  el.setAttribute("role", "status");
  el.setAttribute("aria-live", "polite");
  el.innerHTML = `
    <span class="dl-toast__dot" aria-hidden="true"></span>
    <div class="dl-toast__body">
      <div class="dl-toast__head">
        <strong class="dl-toast__title"></strong>
        <button class="dl-toast__close" type="button" aria-label="Dismiss">×</button>
      </div>
      <code class="dl-toast__file"></code>
      <ol class="dl-toast__steps"></ol>
    </div>
  `;
  document.body.appendChild(el);
  el.querySelector(".dl-toast__close")?.addEventListener("click", () => hide(el));
  return el;
}

function hide(el: ToastEl) {
  el.classList.remove("is-show");
}

function extractFilename(href: string): string {
  try {
    const u = new URL(href, window.location.href);
    return decodeURIComponent(u.pathname.split("/").pop() ?? href);
  } catch {
    return href;
  }
}

function showToast(el: ToastEl, title: string, file: string, steps: string[]) {
  (el.querySelector(".dl-toast__title") as HTMLElement).textContent = title;
  const fileEl = el.querySelector(".dl-toast__file") as HTMLElement;
  if (file) {
    fileEl.textContent = file;
    fileEl.style.display = "";
  } else {
    fileEl.style.display = "none";
  }
  const ol = el.querySelector(".dl-toast__steps") as HTMLElement;
  ol.innerHTML = "";
  steps.forEach((s) => {
    const li = document.createElement("li");
    li.innerHTML = s;
    ol.appendChild(li);
  });
  el.classList.add("is-show");
  window.clearTimeout(el._t);
  el._t = window.setTimeout(() => hide(el), 9000);
}

function messagesFor(kind: "exe" | "deb" | "other", file: string, lang: Lang) {
  if (kind === "exe") {
    return {
      title: lang === "fr" ? "Téléchargement lancé" : "Download started",
      file,
      steps: lang === "fr"
        ? [
            `Si <em>SmartScreen</em> bloque&nbsp;: <em>Informations complémentaires</em> → <em>Exécuter quand même</em>`,
            `Installeur auto-signé — les mises à jour sont signées <em>minisign</em> et vérifiées automatiquement`,
          ]
        : [
            `If <em>SmartScreen</em> blocks: <em>More info</em> → <em>Run anyway</em>`,
            `Self-signed installer — every update is <em>minisign</em>-signed and auto-verified`,
          ],
    };
  }
  if (kind === "deb") {
    return {
      title: lang === "fr" ? "Téléchargement lancé" : "Download started",
      file,
      steps: lang === "fr"
        ? [
            `Installation&nbsp;: <em>sudo apt install ./${file}</em>`,
            `Dépendances&nbsp;: <em>webkit2gtk-4.1</em>, <em>libayatana-appindicator</em>`,
          ]
        : [
            `Install: <em>sudo apt install ./${file}</em>`,
            `Requires: <em>webkit2gtk-4.1</em>, <em>libayatana-appindicator</em>`,
          ],
    };
  }
  return {
    title: lang === "fr" ? "Téléchargement lancé" : "Download started",
    file: "",
    steps: [lang === "fr" ? "Merci d'essayer Manager." : "Thanks for trying Manager."],
  };
}

function wireDownloadToast() {
  const toast = createToast();
  const selector = 'a[href$=".exe"], a[href$=".deb"], a[data-download]';
  document.querySelectorAll<HTMLAnchorElement>(selector).forEach((a) => {
    a.addEventListener("click", () => {
      const isExe = /\.exe(\?|$)/i.test(a.href);
      const isDeb = /\.deb(\?|$)/i.test(a.href);
      const kind: "exe" | "deb" | "other" = isExe ? "exe" : isDeb ? "deb" : "other";
      const file = extractFilename(a.href);
      const m = messagesFor(kind, file, currentLang());
      showToast(toast, m.title, m.file, m.steps);
    });
  });
}

export function initDownload() {
  const os = detectOS();
  lockOS(os);
  if (isMobile()) showMobileDesktopOnly();
  wireDownloadToast();
}
