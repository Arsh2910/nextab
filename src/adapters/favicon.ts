/**
 * Privacy-respecting Favicon Resolver.
 *
 * Strict Privacy Rules:
 * - NEVER uses third-party favicon CDNs (no Google, no DuckDuckGo CDN, etc.).
 * - Only queries direct website-provided resources (direct origin favicon.ico).
 * - Generates clean local SVG monograms as deterministic fallbacks.
 * - Caches successfully resolved direct URLs in localStorage for 0ms paint on revisit.
 */

const STORAGE_CACHE_KEY = "nextab_favicons";
const faviconCache = new Map<string, string>();
const failedFaviconUrls = new Set<string>();

// Pre-load locally cached favicon origins
try {
  const stored = localStorage.getItem(STORAGE_CACHE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    for (const [domain, iconUrl] of Object.entries(parsed)) {
      if (typeof iconUrl === "string") {
        faviconCache.set(domain, iconUrl);
      }
    }
  }
} catch {}

function persistFaviconCache() {
  try {
    const obj: Record<string, string> = {};
    let count = 0;
    for (const [domain, url] of faviconCache.entries()) {
      if (count++ > 300) break;
      obj[domain] = url;
    }
    localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(obj));
  } catch {}
}

export function getCleanDomain(rawUrlOrDomain: string): string {
  if (!rawUrlOrDomain) return "";
  const trimmed = rawUrlOrDomain.trim();
  try {
    const raw = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const host = new URL(raw).hostname.toLowerCase();
    return host.replace(/^www\./, "");
  } catch {
    return trimmed.toLowerCase().replace(/^www\./, "").split("/")[0].trim();
  }
}

/**
 * Generates an attractive, deterministic local SVG monogram without external network requests.
 */
export function fallbackMonogram(urlOrDomain: string, name?: string): string {
  let letter = "?";
  let hue = 210;

  try {
    const clean = getCleanDomain(urlOrDomain);
    const initialSource = name?.trim() || clean;
    if (initialSource) {
      letter = initialSource.charAt(0).toUpperCase();
    }
    for (let i = 0; i < clean.length; i++) {
      hue = (hue * 31 + clean.charCodeAt(i)) % 360;
    }
  } catch {}

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="hsl(${hue},50%,36%)"/><text x="32" y="42" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="28" font-weight="600" fill="white">${letter}</text></svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/**
 * Builds direct origin-only favicon sources (no third-party aggregators).
 */
function buildOriginFaviconSources(domain: string): string[] {
  const clean = getCleanDomain(domain);
  if (!clean) return [];

  // Only direct origin HTTPS favicon resources
  return [
    `https://${clean}/favicon.ico`,
    `https://www.${clean}/favicon.ico`,
  ];
}

/**
 * Loads a favicon for an image element using direct origin fetching or local monogram.
 */
export function loadFavicon(
  img: HTMLImageElement,
  websiteUrl: string,
  domain?: string,
  name?: string
) {
  const clean = getCleanDomain(domain || websiteUrl);

  // If already verified and cached in local storage, render immediately (0ms paint)
  if (clean && faviconCache.has(clean)) {
    const cachedUrl = faviconCache.get(clean)!;
    img.src = cachedUrl;
    img.onerror = () => {
      faviconCache.delete(clean);
      failedFaviconUrls.add(cachedUrl);
      persistFaviconCache();
      tryOriginSources();
    };
    return;
  }

  tryOriginSources();

  function tryOriginSources() {
    const sources = buildOriginFaviconSources(clean).filter((url) => !failedFaviconUrls.has(url));
    let sourceIndex = 0;

    function tryNext() {
      if (sourceIndex >= sources.length) {
        // Direct origin failed; fall back to local monogram SVG
        img.onload = null;
        img.onerror = null;
        img.src = fallbackMonogram(clean, name);
        return;
      }

      const candidate = sources[sourceIndex++];
      let settled = false;

      // 3-second network timeout safeguard for slow or hanging servers
      const timer = window.setTimeout(() => {
        if (!settled) {
          settled = true;
          failedFaviconUrls.add(candidate);
          tryNext();
        }
      }, 3000);

      img.onload = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);

        if (img.naturalWidth <= 0 || img.naturalHeight <= 0) {
          failedFaviconUrls.add(candidate);
          tryNext();
          return;
        }

        // Successfully loaded directly from the website's origin
        if (clean && !candidate.startsWith("data:")) {
          faviconCache.set(clean, candidate);
          persistFaviconCache();
        }
      };

      img.onerror = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);

        failedFaviconUrls.add(candidate);
        tryNext();
      };

      img.src = candidate;
    }

    if (sources.length > 0) {
      tryNext();
    } else {
      img.src = fallbackMonogram(clean, name);
    }
  }
}
