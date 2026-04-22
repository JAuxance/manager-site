# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`manager_site` is the marketing / landing site for [Manager](../Manager/CLAUDE.md) — the desktop productivity app (day counter, focus timer, journal, Dona coach). One-page editorial site, bilingual EN/FR, served at **https://managerladger.com/**.

- **Stack:** Astro 5 + TypeScript. GSAP + ScrollTrigger for motion, Lenis for smooth scroll. **No React, no Tailwind, no UI framework.**
- **Design:** strict black/white, OKLCH `ink`/`paper` (never `#fff`), 4pt spacing, `--radius: 0`. Editorial typography: PP Editorial New (display) + PP Supply Mono (body).
- **Hosting:** Cloudflare Pages. Deploy Hook is pinged by the `manager-releases` repo's `notify-site.yml` each time a release is published, so downloads stay fresh.

## Development Commands

```bash
npm run dev       # astro dev --host → http://localhost:4321
npm run build     # → dist/
npm run preview   # serve dist/
```

Node 18+. There are no tests and no linter.

**Env vars:**
- `GITHUB_TOKEN` (optional) — lifts the 60 req/h rate limit on the unauthenticated GitHub API used by `src/lib/releases.ts`. Recommended in CI. Scope: `public_repo`.

## Architecture

**Single page.** `src/pages/index.astro` assembles sections in order: `Hero → TheWork → Inside → Focus → YourLog → GetStarted → Changelog → SiteFooter`. The only other route is `src/pages/404.astro` (uses the same `Base.astro`).

**Layout (`src/layouts/Base.astro`)** bootstraps everything shared across pages: tokens/reset/fonts/base/utilities CSS, `<Grain>` overlay, custom `<Cursor>`, `<ScrollProgress>`, `<LangToggle>`, `<GithubLink>`, SEO meta, and the client entry `src/scripts/main.ts`.

**Client scripts (`src/scripts/`)** — all plain TS, wired from `main.ts`:
- `main.ts` — initializes Lenis (via `lenis-bridge.ts` — Lenis → ScrollTrigger sync), registers GSAP plugins, then calls each section's init (`hero.ts`, `the-work.ts`, `focus.ts`, `your-log.ts`, `reveal.ts`, `scroll-progress.ts`, `cursor.ts`, `magnetic.ts`, `lang-toggle.ts`, `easter-egg.ts`).
- `hero.ts` — 3D logo intro (perspective 1100px), stamped-letter reveal, `.is-ready` class gates the flash-guard in `Hero.astro`.
- `the-work.ts` — horizontal scroll inside a pinned vertical section (5 panels + intro).
- `reveal.ts` — generic `data-appear` / `data-appear-group` IntersectionObserver-based fade/rise. Adds `.is-appeared` on the element.
- `lenis-bridge.ts` — ticker bridge between Lenis's RAF loop and GSAP's ScrollTrigger so `scrub` reacts to smooth scroll.
- All scripts bail out under `prefers-reduced-motion: reduce` — the site must stay readable without JS motion.

**Releases (`src/lib/releases.ts`)** — single source for download URLs. At build time, fetches `github.com/JAuxance/manager-releases/releases/latest`, memoizes the result for the whole build, and picks the `.exe` / `.deb` asset URLs from the release. Also exposes `getReleaseList(limit)` for the changelog. If the API is unreachable, it falls back to a hardcoded `FALLBACK_VERSION` at the top of the file — **bump that constant manually only if CI is offline AND we publish a major release**; normally the API handles everything.

**Components (`src/components/`)** — `Logo`, `Grain`, `Cursor`, `ScrollProgress`, `LangToggle`, `GithubLink` at the top level; `sections/` holds the editorial sections; `ui/` holds small primitives (`ScrollCue`, `MagneticButton`).

**Styles (`src/styles/`)** — loaded in order by `Base.astro`:
1. `tokens.css` — OKLCH colors, spacing scale `--space-1..9` (4pt), type scale, easings, durations.
2. `reset.css` — minimal CSS reset.
3. `fonts.css` — `@font-face` for PP Editorial New + PP Supply Mono (commented until the `.woff2` files land in `public/fonts/`). System fallbacks (Times/Georgia + ui-monospace) hold the line meanwhile.
4. `base.css` — body defaults, skip-link, main container.
5. `utilities.css` — small helpers (`.eyebrow`, `.visually-hidden`, etc.).

Each section's styles live **inside its own `<style>` block** in the `.astro` file (scoped by Astro). No global component CSS. Don't create a global stylesheet for section-level styles.

**`auth-done.html`** — a standalone post-OAuth return page used by the Manager desktop app's auth flow. Not routed by Astro, not part of the marketing site. It's in `public/` at build time and shipped as-is.

## i18n

Bilingual EN/FR via `data-lang` attributes. **One rendered page, two languages toggled client-side** (no per-locale URL). `LangToggle` + `lang-toggle.ts` sets `html[data-lang="en|fr"]`, and CSS hides the inactive language:

```html
<span data-lang="en">Download</span>
<span data-lang="fr">Télécharger</span>
```

**Discipline:** every user-facing string must ship in both `data-lang="en"` and `data-lang="fr"` variants. There is no central dictionary (the strings live in the templates). When adding copy, always add both immediately — never leave an EN-only string "to translate later", it will ship.

## Design System

- **Colors:** ink `oklch(14% 0.01 80)`, paper `oklch(98% 0.005 80)`. No `#fff`, no `#000`. Accent red stamp exists as a token but stays commented unless explicitly needed.
- **Spacing:** `--space-1` → `--space-9` (4pt base, `clamp()` for large fluid tokens). Never hard-code pixels.
- **Radius:** `--radius: 0`. No rounded corners anywhere.
- **Motion:** GSAP + ScrollTrigger only. Never `setTimeout` for animation. Every motion path must honor `prefers-reduced-motion: reduce` (Lenis disabled, cursor off, entrances flattened). Custom cursor is also off on touch (`(hover: none)`).
- **Grain:** static SVG noise overlay (`<Grain>`) sits above everything at low opacity. Keep it — it's load-bearing for the editorial feel.
- **Typography:** headings use PP Editorial New ultralight italic (`em` inside titles = mute color). Body mono = PP Supply Mono. Eyebrow = mono caps with `--tracking-caps`.

## Key Patterns

- **Single source for release URLs:** always `import { getLatestRelease } from "~/lib/releases"` — never hardcode a GitHub download URL in a section. The `@awaits` in the `.astro` frontmatter benefit from the shared module-level memoization.
- **`~` alias** = `/src` (declared in `astro.config.mjs` via `vite.resolve.alias`). Use `~/components/...`, `~/styles/...`, `~/scripts/...` — not relative paths.
- **Astro scoped styles** — section-level CSS lives inline in the component. If a style needs to leak to children, use `:global(...)` explicitly (see the logo flash-guard in `Hero.astro`).
- **Flash guards:** any element whose JS-driven intro would otherwise flash at final position must be hidden in CSS until the script adds `.is-ready` (cf. `.hero__logo-wrap:not(.is-ready) [data-logo-bar]`). Pair the CSS guard with a `prefers-reduced-motion` escape hatch so reduced-motion users see the static state.
- **`data-reveal-*`, `data-appear`, `data-work-*`, `data-log-*`** — hooks consumed by the scripts. Keep hook names and script file names in sync when adding new sections.
- **Accessibility floor:** contrast ≈ 19:1 ink on paper, skip-link to `#main`, focus-visible 1px solid ink, `aria-label`/`aria-hidden` where SVGs carry meaning, `role="img"`/`<title>` on the Logo component.

## Deployment

- **Cloudflare Pages.** Build: `npm run build`. Output: `dist`. No SSR — fully static.
- **Deploy Hook** pinged by the `notify-site.yml` workflow in [`manager-releases`](https://github.com/JAuxance/manager-releases) on every `release: published`, so the download URLs refresh without manual intervention.
- **Domain:** `managerladger.com` (apex + www → apex). HTTPS via Cloudflare.
- **`GITHUB_TOKEN`** in the Cloudflare build env is recommended to avoid API rate-limiting on busy build windows.

## Related Repos

- [`Manager`](../Manager/CLAUDE.md) — the desktop app (Tauri v2 + Rust, vanilla JS frontend) this site advertises.
- [`manager-releases`](https://github.com/JAuxance/manager-releases) — public repo where Windows/Linux installers are uploaded by the app's CI. The site pulls download URLs from its releases API.
