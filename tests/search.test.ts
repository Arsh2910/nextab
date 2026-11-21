import assert from "node:assert/strict";
import test from "node:test";
import {
  fetchAutocompleteSuggestions,
  parseAutocompleteResponse,
} from "../src/adapters/search.ts";

test("parses DuckDuckGo list responses", () => {
  assert.deepEqual(
    parseAutocompleteResponse(["git", ["github", "github login", ""]]),
    ["github", "github login"],
  );
});

test("parses object responses and ignores malformed values", () => {
  assert.deepEqual(
    parseAutocompleteResponse([{ phrase: " github " }, { phrase: 42 }, null]),
    [],
  );
  assert.deepEqual(
    parseAutocompleteResponse([{ phrase: " github " }, { phrase: "github login" }]),
    ["github", "github login"],
  );
});

test("returns an empty array for invalid responses", () => {
  assert.deepEqual(parseAutocompleteResponse(null), []);
  assert.deepEqual(parseAutocompleteResponse({ suggestions: ["github"] }), []);
});

test("caches equivalent queries without a second network request", async () => {
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  let calls = 0;

  globalThis.window = globalThis as typeof window;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response(JSON.stringify(["git", ["github"]]), { status: 200 });
  };

  try {
    assert.deepEqual(await fetchAutocompleteSuggestions(" CacheMe "), ["github"]);
    assert.deepEqual(await fetchAutocompleteSuggestions("cacheme"), ["github"]);
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.window = originalWindow;
  }
});

test("empty queries do not make a network request", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response("[]", { status: 200 });
  };
  try {
    assert.deepEqual(await fetchAutocompleteSuggestions("   "), []);
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("cancels timed-out requests", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (_input, init) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        reject(new DOMException("Aborted", "AbortError"));
      }, { once: true });
    });

  try {
    await assert.rejects(
      fetchAutocompleteSuggestions("timeout-query", { timeoutMs: 10 }),
      (error: unknown) => error instanceof DOMException && error.name === "TimeoutError",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("aborted responses are not cached", async () => {
  const originalFetch = globalThis.fetch;
  const controller = new AbortController();
  let calls = 0;
  globalThis.fetch = async (_input, init) => {
    calls += 1;
    if (init?.signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    await new Promise<void>((resolve) => {
      init?.signal?.addEventListener("abort", () => resolve(), { once: true });
    });
    throw new DOMException("Aborted", "AbortError");
  };

  const pending = fetchAutocompleteSuggestions("abort-no-cache", { signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, (error: unknown) =>
    error instanceof DOMException && error.name === "AbortError");

  globalThis.fetch = async () => {
    calls += 1;
    return new Response(JSON.stringify(["abort", ["fresh result"]]), { status: 200 });
  };
  assert.deepEqual(await fetchAutocompleteSuggestions("abort-no-cache"), ["fresh result"]);
  assert.equal(calls, 2);

  globalThis.fetch = originalFetch;
});

test("cancels requests when the caller aborts", async () => {
  const originalFetch = globalThis.fetch;
  const controller = new AbortController();
  globalThis.fetch = (_input, init) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        reject(new DOMException("Aborted", "AbortError"));
      }, { once: true });
    });

  const pending = fetchAutocompleteSuggestions("cancel-query", { signal: controller.signal });
  controller.abort();
  try {
    await assert.rejects(pending, (error: unknown) =>
      error instanceof DOMException && error.name === "AbortError");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("one caller can cancel while another caller shares the result", async () => {
  const originalFetch = globalThis.fetch;
  const controller = new AbortController();
  let resolveFetch!: (response: Response) => void;
  let sharedSignal: AbortSignal | undefined;
  let calls = 0;

  globalThis.fetch = (_input, init) => {
    calls += 1;
    sharedSignal = init?.signal;
    return new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
  };

  try {
    const canceled = fetchAutocompleteSuggestions("shared-cancel-query", {
      signal: controller.signal,
    });
    const other = fetchAutocompleteSuggestions("shared-cancel-query");

    controller.abort();
    await assert.rejects(canceled, (error: unknown) =>
      error instanceof DOMException && error.name === "AbortError");
    assert.equal(sharedSignal?.aborted, false);

    resolveFetch(new Response(
      JSON.stringify(["shared", ["shared result"]]),
      { status: 200 },
    ));
    assert.deepEqual(await other, ["shared result"]);
    assert.equal(calls, 1);

    assert.deepEqual(
      await fetchAutocompleteSuggestions("shared-cancel-query"),
      ["shared result"],
    );
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("one caller can time out while another caller shares the result", async () => {
  const originalFetch = globalThis.fetch;
  const firstController = new AbortController();
  let resolveFetch!: (response: Response) => void;
  let sharedSignal: AbortSignal | undefined;
  let calls = 0;

  globalThis.fetch = (_input, init) => {
    calls += 1;
    sharedSignal = init?.signal;
    return new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
  };

  try {
    const timedOut = fetchAutocompleteSuggestions("shared-timeout-query", {
      signal: firstController.signal,
      timeoutMs: 10,
    });
    const other = fetchAutocompleteSuggestions("shared-timeout-query");

    await assert.rejects(
      timedOut,
      (error: unknown) => error instanceof DOMException && error.name === "TimeoutError",
    );
    assert.equal(sharedSignal?.aborted, false);

    resolveFetch(new Response(
      JSON.stringify(["shared", ["shared timeout result"]]),
      { status: 200 },
    ));
    assert.deepEqual(await other, ["shared timeout result"]);
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("handles HTTP errors without caching the failed response", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    if (calls === 1) return new Response("error", { status: 503 });
    return new Response(JSON.stringify(["retry", ["retry result"]]), { status: 200 });
  };

  try {
    await assert.rejects(
      fetchAutocompleteSuggestions("http-retry"),
      /HTTP 503/,
    );
    assert.deepEqual(await fetchAutocompleteSuggestions("http-retry"), ["retry result"]);
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("handles network failures without caching", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    if (calls === 1) throw new TypeError("Network unavailable");
    return new Response(JSON.stringify(["network", ["network result"]]), { status: 200 });
  };

  try {
    await assert.rejects(
      fetchAutocompleteSuggestions("network-retry"),
      /Network unavailable/,
    );
    assert.deepEqual(await fetchAutocompleteSuggestions("network-retry"), ["network result"]);
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("expires cached entries and refreshes them", async () => {
  const originalFetch = globalThis.fetch;
  const originalNow = Date.now;
  let now = 1_000;
  let calls = 0;
  Date.now = () => now;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response(JSON.stringify(["expire", [`result ${calls}`]]), { status: 200 });
  };

  try {
    assert.deepEqual(await fetchAutocompleteSuggestions("expire-query"), ["result 1"]);
    now += 30_001;
    assert.deepEqual(await fetchAutocompleteSuggestions("expire-query"), ["result 2"]);
    assert.equal(calls, 2);
  } finally {
    Date.now = originalNow;
    globalThis.fetch = originalFetch;
  }
});

test("keeps multiple query results separate", async () => {
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    const query = url.searchParams.get("q") ?? "";
    calls.push(query);
    return new Response(JSON.stringify([query, [`${query} result`]]), { status: 200 });
  };

  try {
    assert.deepEqual(await fetchAutocompleteSuggestions("alpha"), ["alpha result"]);
    assert.deepEqual(await fetchAutocompleteSuggestions("beta"), ["beta result"]);
    assert.deepEqual(await fetchAutocompleteSuggestions("alpha"), ["alpha result"]);
    assert.deepEqual(calls, ["alpha", "beta"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
