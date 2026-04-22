/**
 * Reveal universel — IntersectionObserver, un-shot (unobserve après déclenchement).
 *
 * Usage :
 *   <h2 data-appear>…</h2>                      // fade + translateY
 *   <p  data-appear="left">…</p>                // slide depuis la gauche
 *   <p  data-appear="right">…</p>
 *   <p  data-appear="scale">…</p>               // zoom doux
 *   <li data-appear data-appear-delay="120">…</li>  // délai en ms
 *
 * Stagger groupé :
 *   <ul data-appear-group>
 *     <li data-appear>…</li>   // délai auto : 0, 80ms, 160ms, …
 *     <li data-appear>…</li>
 *   </ul>
 *
 * Le CSS correspondant est dans src/styles/utilities.css (.is-appeared).
 */
const STAGGER_MS = 80;

export function initReveal(reduced: boolean) {
  const els = Array.from(
    document.querySelectorAll<HTMLElement>("[data-appear]")
  );
  if (els.length === 0) return;

  // Auto-stagger dans les groupes.
  const groups = document.querySelectorAll<HTMLElement>("[data-appear-group]");
  groups.forEach((group) => {
    const children = Array.from(
      group.querySelectorAll<HTMLElement>(":scope > [data-appear]")
    );
    children.forEach((child, i) => {
      if (!child.dataset.appearDelay) {
        child.dataset.appearDelay = String(i * STAGGER_MS);
      }
    });
  });

  // Applique le delay inline si défini.
  els.forEach((el) => {
    const d = el.dataset.appearDelay;
    if (d) el.style.setProperty("--appear-delay", `${d}ms`);
  });

  if (reduced) {
    els.forEach((el) => el.classList.add("is-appeared"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        el.classList.add("is-appeared");
        io.unobserve(el);
      }
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -6% 0px",
    }
  );

  els.forEach((el) => io.observe(el));
}
