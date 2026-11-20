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
