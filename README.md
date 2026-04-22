# Manager — Site

**Live** : [https://managerladger.com](https://managerladger.com/)

Site vitrine one-page pour [Manager](https://github.com/JAuxance/manager-releases) — day counter, focus timer, journal, coach IA (Dona).

**Stack** : Astro 5, GSAP + Lenis, TypeScript. Pas de React, pas de Tailwind.
**Design** : noir/blanc strict, typographie éditoriale (PP Editorial New + PP Supply Mono), OKLCH ink/paper, grain SVG.
**i18n** : EN/FR via `data-lang`, toggle en haut à gauche.

## Dev

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # → dist/
npm run preview
```

Node 18+ requis.

## Releases — liens de download auto

Les URLs des boutons Download sont tirées de l'API GitHub au build (voir `src/lib/releases.ts`). Quand une nouvelle release est publiée sur [`manager-releases`](https://github.com/JAuxance/manager-releases), un rebuild du site suffit à mettre à jour tous les liens — aucun code à toucher.

Le workflow du repo releases ping le Deploy Hook Cloudflare à chaque `release: published`, donc le cycle est 100 % automatique.

Fallback hardcodé dans `releases.ts` si l'API GitHub est injoignable au build — le site build toujours.

**Rate-limit** : l'API non-authentifiée = 60 req/h par IP. Pour blinder en CI, expose `GITHUB_TOKEN` dans les env vars du build.

## Fontes

Le site est conçu pour **PP Editorial New** (display) + **PP Supply Mono** (body). Tant que les `.woff2` ne sont pas déposés, les fallbacks système (Times/Georgia + ui-monospace) prennent le relais.

Pour activer les vraies fontes :

1. Poser les fichiers dans `public/fonts/` :
   - `PPEditorialNew-Ultralight.woff2`
   - `PPEditorialNew-UltralightItalic.woff2`
   - `PPEditorialNew-Regular.woff2`
   - `PPSupplyMono-Regular.woff2`
   - `PPSupplyMono-Medium.woff2`
2. Décommenter les `@font-face` dans `src/styles/fonts.css`.
3. Décommenter les `<link rel="preload">` dans `src/layouts/Base.astro`.

## Arborescence

```
src/
├── pages/index.astro             # assemble les sections
├── layouts/Base.astro            # meta, fontes, Grain, Cursor, bootstrap main.ts
├── lib/releases.ts               # fetch GitHub API au build, mémoïsé
├── components/
│   ├── Logo.astro                # SVG 4 barres + diagonale
│   ├── Grain.astro               # overlay noise
│   ├── Cursor.astro              # curseur custom
│   ├── GithubLink.astro
│   ├── LangToggle.astro
│   ├── sections/
│   │   ├── Hero.astro            # logo animé + CTAs download
│   │   ├── TheWork.astro
│   │   ├── CountTheDays.astro
│   │   ├── Focus.astro
│   │   ├── YourLog.astro
│   │   ├── GetStarted.astro      # étapes + FAQ + download
│   │   └── SiteFooter.astro
│   └── ui/
│       ├── ScrollCue.astro
│       └── MagneticButton.astro
├── scripts/                      # GSAP/Lenis, respecte prefers-reduced-motion
└── styles/                       # tokens OKLCH, reset, base, utilities
auth-done.html                    # page standalone de retour OAuth
```

## Design tokens

- Ink `oklch(14% 0.01 80)` sur paper `oklch(98% 0.005 80)` — pas de `#fff` pur.
- Accent rouge "tampon" disponible mais commenté dans `tokens.css`.
- Espacement strict 4pt.
- `--radius: 0` — aucune rondeur.
- Animations via GSAP + ScrollTrigger (`scrub`). Jamais `setTimeout`.

## Accessibilité

- `prefers-reduced-motion` → anims off, Lenis non initialisé, curseur custom off.
- Curseur custom désactivé sur pointeurs tactiles (`hover: none`).
- Contraste ink/paper ≈ 19:1.
- Skip-link clavier, focus-visible à 1px solid ink.

## Déploiement

Déployé sur **Cloudflare Pages** à [managerladger.com](https://managerladger.com/).

- Build command : `npm run build`
- Output : `dist`
- Env var recommandée : `GITHUB_TOKEN` (évite le rate-limit API)
- Intégration Git : chaque push sur `main` déclenche un rebuild automatique.
- Deploy Hook pingé en plus par le workflow `notify-site.yml` du repo `manager-releases` à chaque release publiée (rafraîchit les URLs de download).

## License

Privé. Code source du site non destiné à être réutilisé tel quel.
