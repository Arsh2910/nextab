/** Network adapter for DuckDuckGo autocomplete requests. */
const ENDPOINT = "https://duckduckgo.com/ac/";
export const REQUEST_TIMEOUT_MS = 3_000;
export const CACHE_TTL_MS = 30_000;
const MAX_CACHE_ENTRIES = 50;

type CacheEntry = { suggestions: string[]; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<string[]>>();

export type AutocompleteOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
};

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

function pruneExpiredEntries(now = Date.now()) {
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key);
  }
}

function remember(query: string, suggestions: string[]) {
  pruneExpiredEntries();
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(query, {
    suggestions: [...suggestions],
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

export async function fetchAutocompleteSuggestions(
  query: string,
  options: AutocompleteOptions = {},
): Promise<string[]> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const now = Date.now();
  pruneExpiredEntries(now);
  const cached = cache.get(normalized);
  if (cached) return [...cached.suggestions];

  if (options.signal?.aborted) {
    throw new DOMException("Autocomplete request aborted", "AbortError");
  }

  const existing = inFlight.get(normalized);
  if (existing) return existing;

  const controller = new AbortController();
  let abortedByTimeout = false;

  const abortFromExternal = () => {
    controller.abort();
  };
  const abortFromTimeout = () => {
    abortedByTimeout = true;
    controller.abort();
  };

  if (options.signal) options.signal.addEventListener("abort", abortFromExternal, { once: true });
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const timer = setTimeout(abortFromTimeout, timeoutMs);

  const request = (async () => {
    try {
      const response = await fetch(
        `${ENDPOINT}?q=${encodeURIComponent(query.trim())}&type=list`,
        { signal: controller.signal },
      );
      if (controller.signal.aborted) {
        throw new DOMException("Autocomplete request aborted", "AbortError");
      }
      if (!response.ok) {
        throw new Error(`Autocomplete request failed: HTTP ${response.status}`);
      }
      const suggestions = parseAutocompleteResponse(await response.json());
      if (controller.signal.aborted) {
        throw new DOMException("Autocomplete request aborted", "AbortError");
      }
      remember(normalized, suggestions);
      return [...suggestions];
    } catch (error) {
      if (abortedByTimeout) {
        throw new DOMException("Autocomplete request timed out", "TimeoutError");
      }
      throw error;
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", abortFromExternal);
      inFlight.delete(normalized);
    }
  })();

  inFlight.set(normalized, request);
  return request;
}
