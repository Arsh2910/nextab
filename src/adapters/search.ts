/** Network adapter for DuckDuckGo autocomplete requests. */
const ENDPOINT = "https://duckduckgo.com/ac/";
const REQUEST_TIMEOUT_MS = 3_000;
const CACHE_TTL_MS = 30_000;
const MAX_CACHE_ENTRIES = 50;

type CacheEntry = { suggestions: string[]; expiresAt: number };
const cache = new Map<string, CacheEntry>();

export function parseAutocompleteResponse(data: unknown): string[] {
  if (!Array.isArray(data)) return [];
  let values: unknown[] = data;
  if (data.length >= 2 && Array.isArray(data[1])) values = data[1];
  else if (data.every((item) => typeof item === "object" && item !== null && "phrase" in item)) {
    values = data.map((item) => (item as { phrase?: unknown }).phrase);
  }
  return values
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

function remember(query: string, suggestions: string[]) {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(query, { suggestions, expiresAt: Date.now() + CACHE_TTL_MS });
}

export async function fetchAutocompleteSuggestions(
  query: string,
  options: { signal?: AbortSignal } = {},
): Promise<string[]> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  const cached = cache.get(normalized);
  if (cached && cached.expiresAt > Date.now()) return [...cached.suggestions];
  if (cached) cache.delete(normalized);

  const timeout = new AbortController();
  const timer = window.setTimeout(() => timeout.abort(), REQUEST_TIMEOUT_MS);
  const signal = options.signal ? AbortSignal.any([options.signal, timeout.signal]) : timeout.signal;
  try {
    const response = await fetch(`${ENDPOINT}?q=${encodeURIComponent(query.trim())}&type=list`, { signal });
    if (!response.ok) throw new Error(`Autocomplete request failed: HTTP ${response.status}`);
    const suggestions = parseAutocompleteResponse(await response.json());
    remember(normalized, suggestions);
    return [...suggestions];
  } finally {
    window.clearTimeout(timer);
  }
}
