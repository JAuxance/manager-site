/* ============================================================================
   releases.ts — Source unique pour les URLs de download.

   Appelé au build (frontmatter Astro) ; le résultat est mémoïsé pour tout le
   build, donc une seule requête API quel que soit le nombre de composants qui
   l'importent. Si l'API GitHub est injoignable (rate-limit, offline, etc.), on
   retombe sur un fallback hardcodé — le site build toujours.

   Pour authentifier les appels (évite le rate-limit 60/h par IP en CI) :
     export GITHUB_TOKEN=<token-avec-scope-public_repo>
   ========================================================================= */

const REPO = "JAuxance/manager-releases";
const API_URL = `https://api.github.com/repos/${REPO}/releases/latest`;

/* Fallback figé — utilisé si l'API est HS au moment du build.
   Mettre à jour ici uniquement si on publie une release majeure et que le
   réseau CI est KO — sinon, l'API prend le relais toute seule. */
const FALLBACK_VERSION = "1.7.2";
const FALLBACK_BASE = `https://github.com/${REPO}/releases/download/v${FALLBACK_VERSION}`;
const FALLBACK: ReleaseInfo = {
  version: FALLBACK_VERSION,
  winUrl: `${FALLBACK_BASE}/Manager_${FALLBACK_VERSION}_x64-setup.exe`,
  debUrl: `${FALLBACK_BASE}/Manager_${FALLBACK_VERSION}_amd64.deb`,
  macUrl: null,
  htmlUrl: `https://github.com/${REPO}/releases/latest`,
  stale: true,
};

export interface ReleaseInfo {
  version: string;
  winUrl: string;
  debUrl: string;
  macUrl: string | null;
  htmlUrl: string;
  /** true si on sert le fallback (API injoignable). */
  stale: boolean;
}

interface GitHubAsset {
  name: string;
  browser_download_url: string;
}

interface GitHubRelease {
  tag_name: string;
  html_url: string;
  assets: GitHubAsset[];
}

let cached: Promise<ReleaseInfo> | null = null;

export function getLatestRelease(): Promise<ReleaseInfo> {
  if (!cached) cached = fetchLatest();
  return cached;
}

async function fetchLatest(): Promise<ReleaseInfo> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "manager-site-build",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(API_URL, { headers });
    if (!res.ok) {
      console.warn(`[releases] API HTTP ${res.status} — falling back to v${FALLBACK.version}`);
      return FALLBACK;
    }
    const data = (await res.json()) as GitHubRelease;
    const version = data.tag_name.replace(/^v/, "");
    const find = (re: RegExp) =>
      data.assets.find((a) => re.test(a.name))?.browser_download_url ?? null;

    return {
      version,
      winUrl: find(/\.exe$/i) ?? FALLBACK.winUrl,
      debUrl: find(/\.deb$/i) ?? FALLBACK.debUrl,
      macUrl: find(/\.(dmg|app\.tar\.gz)$/i),
      htmlUrl: data.html_url,
      stale: false,
    };
  } catch (err) {
    console.warn(`[releases] fetch failed — falling back to v${FALLBACK.version}`, err);
    return FALLBACK;
  }
}
