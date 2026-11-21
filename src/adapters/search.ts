/** Network adapter for DuckDuckGo autocomplete requests. */
const ENDPOINT = "https://duckduckgo.com/ac/";
export const REQUEST_TIMEOUT_MS = 3_000;
export const CACHE_TTL_MS = 30_000;
const MAX_CACHE_ENTRIES = 50;

type CacheEntry = { suggestions: string[]; expiresAt: number };
type InFlightEntry = {
  promise: Promise<string[]>;
  controller: AbortController;
  callerCount: number;
};
const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, InFlightEntry>();

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
  if (existing) return subscribeToInFlight(normalized, existing, options);

  const controller = new AbortController();
  const entry: InFlightEntry = {
    promise: Promise.resolve([]),
    controller,
    callerCount: 0,
  };

  entry.promise = (async () => {
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
    } finally {
      if (inFlight.get(normalized) === entry) inFlight.delete(normalized);
    }
  })();

  inFlight.set(normalized, entry);
  return subscribeToInFlight(normalized, entry, options);
}

function subscribeToInFlight(
  normalized: string,
  entry: InFlightEntry,
  options: AutocompleteOptions,
): Promise<string[]> {
  entry.callerCount += 1;

  return new Promise<string[]>((resolve, reject) => {
    let settled = false;
    const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;

    const release = (cancelRequest: boolean) => {
      if (options.signal) options.signal.removeEventListener("abort", abortFromCaller);
      clearTimeout(timer);
      entry.callerCount -= 1;
      if (cancelRequest && entry.callerCount === 0) {
        entry.controller.abort();
        if (inFlight.get(normalized) === entry) inFlight.delete(normalized);
      }
    };

    const abortFromCaller = () => {
      if (settled) return;
      settled = true;
      release(true);
      reject(new DOMException("Autocomplete request aborted", "AbortError"));
    };

    if (options.signal) {
      options.signal.addEventListener("abort", abortFromCaller, { once: true });
    }

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      release(true);
      reject(new DOMException("Autocomplete request timed out", "TimeoutError"));
    }, timeoutMs);

    entry.promise.then(
      (suggestions) => {
        if (settled) return;
        settled = true;
        release(false);
        resolve([...suggestions]);
      },
      (error) => {
        if (settled) return;
        settled = true;
        release(false);
        reject(error);
      },
    );
  });
}
