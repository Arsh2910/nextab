/**
 * Page chrome shared by every scene: glass segmented choices and the chat composer.
 */

import { findMatchingWebsites, parseExplicitUrl, inferWebsiteSuggestion, type WebService } from "./websites";
import { getBookmarksTree } from "./src/adapters/bookmarks";
import { loadFavicon } from "./src/adapters/favicon";

export function greetingFor(name?: string, date = new Date()) {
  const h = date.getHours();
  const timeOfDay = h >= 5 && h < 12 ? "Good morning" : h >= 12 && h < 17 ? "Good afternoon" : h >= 17 && h < 22 ? "Good evening" : "Still up";
  return name?.trim() ? `${timeOfDay}, ${name.trim()}` : timeOfDay;
}

export function mountGreeting(name?: string) {
  const el = document.querySelector<HTMLElement>(".greeting");
  if (!el) return;

  const update = () => (el.textContent = greetingFor(name));
  update();
  setInterval(update, 60_000);
}

/** Parses DuckDuckGo autocomplete response across list and object formats safely. */
function parseDuckDuckGoSuggestions(data: unknown): string[] {
  if (!Array.isArray(data)) return [];
  // OpenSearch list format: [query, [sugg1, sugg2, ...]]
  if (data.length >= 2 && Array.isArray(data[1])) {
    return (data[1] as unknown[])
      .filter((s): s is string => typeof s === "string")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  // Object format: [{ phrase: "..." }, ...]
  if (data.length > 0 && typeof data[0] === "object" && data[0] !== null && "phrase" in data[0]) {
    return (data as Array<{ phrase?: unknown }>)
      .map((item) => (typeof item.phrase === "string" ? item.phrase.trim() : ""))
      .filter(Boolean);
  }
  // Plain string array: ["...", "..."]
  if (data.length > 0 && typeof data[0] === "string") {
    return (data as string[]).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

interface BookmarkedSite {
  title: string;
  url: string;
  domain: string;
}

type WebsiteSuggestionItem =
  | {
      type: "website";
      title: string;
      url: string;
      domain: string;
      badgeText: string;
      badgeClass: "website" | "url";
    }
  | {
      type: "bookmark";
      title: string;
      url: string;
      domain: string;
      badgeText: string;
      badgeClass: "bookmark";
    };

type AutocompleteItem =
  | WebsiteSuggestionItem
  | {
      type: "search";
      query: string;
    };

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    return (u.hostname.toLowerCase().replace(/^www\./, "") + u.pathname.replace(/\/$/, "")).toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

// STRICT PRIVACY: Only bookmarks are used for website suggestions.
// Never use topSites, history, or recently visited sites.
let bookmarkedSites: BookmarkedSite[] = [];

async function refreshBookmarkedSites() {
  try {
    const tree = await getBookmarksTree();
    const sitesMap = new Map<string, BookmarkedSite>();

    function collect(nodes: any[]) {
      if (!Array.isArray(nodes)) return;
      for (const node of nodes) {
        if (node?.url && /^https?:\/\//i.test(node.url)) {
          const domain = extractDomain(node.url);
          const key = normalizeUrl(node.url);
          if (!sitesMap.has(key)) {
            sitesMap.set(key, {
              title: (node.title || domain).trim(),
              url: node.url,
              domain,
            });
          }
        }
        if (node?.children) collect(node.children);
      }
    }

    collect(tree);
    bookmarkedSites = Array.from(sitesMap.values());
  } catch {
    bookmarkedSites = [];
  }
}

function matchBookmarks(query: string, maxResults = 2): BookmarkedSite[] {
  const q = query.trim().toLowerCase();
  // Require at least 2 characters to match a bookmark so single letters don't overwhelm search
  if (!q || q.length < 2) return [];

  const exactDomainMatches: BookmarkedSite[] = [];
  const prefixDomainMatches: BookmarkedSite[] = [];
  const prefixTitleMatches: BookmarkedSite[] = [];
  const seenKeys = new Set<string>();

  for (const site of bookmarkedSites) {
    const d = site.domain.toLowerCase();
    const t = site.title.toLowerCase();
    const key = normalizeUrl(site.url);

    if (seenKeys.has(key)) continue;

    const domainWithoutTld = d.replace(/\.[a-z]+$/i, "");
    if (d === q || domainWithoutTld === q || d === "www." + q) {
      exactDomainMatches.push(site);
      seenKeys.add(key);
    } else if (d.startsWith(q) || d.startsWith("www." + q)) {
      prefixDomainMatches.push(site);
      seenKeys.add(key);
    } else if (t.startsWith(q)) {
      prefixTitleMatches.push(site);
      seenKeys.add(key);
    }
  }

  return [...exactDomainMatches, ...prefixDomainMatches, ...prefixTitleMatches].slice(0, maxResults);
}

export function mountComposer() {
  const form = document.querySelector<HTMLFormElement>(".composer");
  if (!form) return;

  const textareaEl = form.querySelector<HTMLTextAreaElement>("textarea");
  if (!textareaEl) return;
  const input: HTMLTextAreaElement = textareaEl;

  // The send button is optional because the current design has no send button.
  const send = form.querySelector<HTMLButtonElement>("button.send");

  // Create suggestions dropdown immediately underneath composer
  const suggestionsList = document.createElement("ul");
  suggestionsList.className = "composer-suggestions";
  suggestionsList.id = "search-suggestions";
  suggestionsList.setAttribute("role", "listbox");
  suggestionsList.setAttribute("aria-label", "Search suggestions");
  form.append(suggestionsList);

  input.setAttribute("role", "combobox");
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-expanded", "false");
  input.setAttribute("aria-controls", "search-suggestions");

  let suggestions: AutocompleteItem[] = [];
  let currentWebsiteMatches: WebsiteSuggestionItem[] = [];
  let selectedIndex = -1;
  let abortController: AbortController | null = null;
  let debounceTimer = 0;
  let isFocusMode = false;
  let lastTypedQuery = "";

  // Initial load of bookmarks (strictly bookmarks, no topSites)
  refreshBookmarkedSites();

  function fit() {
    input.style.height = "auto";
    input.style.height = `${input.scrollHeight}px`;

    input.style.overflowY =
      input.scrollHeight > input.clientHeight + 1 ? "auto" : "hidden";

    if (send) {
      send.disabled = input.value.trim() === "";
    }
  }

  function enterFocusMode() {
    if (!isFocusMode) {
      isFocusMode = true;
      document.body.classList.add("focus-mode");
    }
  }

  function exitFocusMode() {
    if (isFocusMode) {
      isFocusMode = false;
      document.body.classList.remove("focus-mode");
    }
    closeSuggestions();
  }

  function closeSuggestions() {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    clearTimeout(debounceTimer);
    suggestions = [];
    currentWebsiteMatches = [];
    selectedIndex = -1;
    suggestionsList.classList.remove("open");
    suggestionsList.replaceChildren();
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
  }

  function navigateTo(url: string) {
    exitFocusMode();
    window.location.href = url;
  }

  function submitSearch(query: string) {
    const text = query.trim();
    if (!text) return;

    exitFocusMode();
    input.value = text;
    fit();

    // Brave Search is strictly maintained as the actual search engine
    window.location.href =
      "https://search.brave.com/search?q=" + encodeURIComponent(text);
  }

  function selectItem(item: AutocompleteItem) {
    if (item.type === "website" || item.type === "bookmark") {
      navigateTo(item.url);
    } else {
      submitSearch(item.query);
    }
  }

  function updateSelection(index: number) {
    if (suggestions.length === 0) return;

    if (index < 0) {
      selectedIndex = suggestions.length - 1;
    } else if (index >= suggestions.length) {
      selectedIndex = 0;
    } else {
      selectedIndex = index;
    }

    const items = suggestionsList.querySelectorAll<HTMLLIElement>(".suggestion-item");
    items.forEach((item, i) => {
      const isSelected = i === selectedIndex;
      item.classList.toggle("selected", isSelected);
      item.setAttribute("aria-selected", String(isSelected));
      if (isSelected) {
        item.scrollIntoView({ block: "nearest" });
        input.setAttribute("aria-activedescendant", item.id);
        const sel = suggestions[i];
        if (sel.type === "website") {
          input.value = sel.domain;
        } else if (sel.type === "bookmark") {
          input.value = sel.title;
        } else {
          input.value = sel.query;
        }
      }
    });

    if (selectedIndex === -1) {
      input.removeAttribute("aria-activedescendant");
      input.value = lastTypedQuery;
    }
  }

  function renderSuggestions() {
    suggestionsList.replaceChildren();

    if (suggestions.length === 0) {
      suggestionsList.classList.remove("open");
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
      return;
    }

    suggestions.forEach((item, i) => {
      const li = document.createElement("li");
      li.className = `suggestion-item ${item.type}-match`;
      li.id = `suggestion-item-${i}`;
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", "false");

      if (item.type === "website" || item.type === "bookmark") {
        // Direct website origin icon with local SVG monogram fallback (zero third-party CDNs)
        const faviconImg = document.createElement("img");
        faviconImg.className = "suggestion-favicon";
        faviconImg.width = 22;
        faviconImg.height = 22;
        faviconImg.alt = "";
        loadFavicon(faviconImg, item.url, item.domain, item.title);

        // Content: Title and Domain
        const content = document.createElement("div");
        content.className = "suggestion-content";

        const titleSpan = document.createElement("span");
        titleSpan.className = "suggestion-title";
        titleSpan.textContent = item.title;

        const urlSpan = document.createElement("span");
        urlSpan.className = "suggestion-url";
        urlSpan.textContent = item.domain;

        content.append(titleSpan, urlSpan);

        // Clean Badge
        const badgeSpan = document.createElement("span");
        badgeSpan.className = `suggestion-badge ${item.badgeClass}`;
        badgeSpan.textContent = item.badgeText;

        li.append(faviconImg, content, badgeSpan);
      } else {
        // Search SVG icon
        const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        icon.setAttribute("class", "suggestion-icon");
        icon.setAttribute("width", "16");
        icon.setAttribute("height", "16");
        icon.setAttribute("viewBox", "0 0 24 24");
        icon.setAttribute("fill", "none");
        icon.setAttribute("stroke", "currentColor");
        icon.setAttribute("stroke-width", "2");
        icon.setAttribute("stroke-linecap", "round");
        icon.setAttribute("stroke-linejoin", "round");
        icon.setAttribute("aria-hidden", "true");

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", "10.5");
        circle.setAttribute("cy", "10.5");
        circle.setAttribute("r", "6.5");

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", "m15.5 15.5 5 5");

        icon.append(circle, path);

        // Content: Query text (SAFE: using textContent, never innerHTML)
        const content = document.createElement("div");
        content.className = "suggestion-content";

        const titleSpan = document.createElement("span");
        titleSpan.className = "suggestion-title";
        titleSpan.textContent = item.query;

        content.append(titleSpan);
        li.append(icon, content);
      }

      // Hover interaction: highlight hovered item
      li.addEventListener("pointerenter", () => {
        selectedIndex = i;
        const allItems = suggestionsList.querySelectorAll<HTMLLIElement>(".suggestion-item");
        allItems.forEach((el, idx) => {
          const isSelected = idx === i;
          el.classList.toggle("selected", isSelected);
          el.setAttribute("aria-selected", String(isSelected));
        });
        input.setAttribute("aria-activedescendant", li.id);
      });

      // Mouse click selection
      li.addEventListener("pointerdown", (e) => {
        // Prevent textarea from blurring before click completes
        e.preventDefault();
      });

      li.addEventListener("click", (e) => {
        e.preventDefault();
        selectItem(item);
      });

      suggestionsList.append(li);
    });

    suggestionsList.classList.add("open");
    input.setAttribute("aria-expanded", "true");
  }

  function getWebsiteMatches(trimmed: string): WebsiteSuggestionItem[] {
    if (!trimmed) return [];
    const websiteItems: WebsiteSuggestionItem[] = [];
    const seenKeys = new Set<string>();

    // A. Explicit URL check (e.g. "github.com", "example.com/test", "https://...")
    const explicitUrl = parseExplicitUrl(trimmed);
    if (explicitUrl) {
      const key = normalizeUrl(explicitUrl.url);
      seenKeys.add(key);
      seenKeys.add(explicitUrl.domain);
      websiteItems.push({
        type: "website",
        title: explicitUrl.domain,
        url: explicitUrl.url,
        domain: explicitUrl.domain,
        badgeText: "Go to website",
        badgeClass: "url",
      });
    }

    // B. Check user bookmarks (strictly bookmarks, max 2)
    const matchedBookmarks = matchBookmarks(trimmed, 2);
    for (const b of matchedBookmarks) {
      const key = normalizeUrl(b.url);
      if (!seenKeys.has(key) && !seenKeys.has(b.domain)) {
        seenKeys.add(key);
        seenKeys.add(b.domain);
        websiteItems.push({
          type: "bookmark",
          title: b.title,
          url: b.url,
          domain: b.domain,
          badgeText: "Bookmark",
          badgeClass: "bookmark",
        });
      }
    }

    // C. Universal Website Recognition from partial words across the internet
    // Recognises "ins" -> Instagram, "met" -> Meta, "wh" -> WhatsApp, "myn" -> Myntra, etc.
    const matchedServices = findMatchingWebsites(trimmed, 2);
    for (const service of matchedServices) {
      const key = normalizeUrl(service.url);
      const domainLower = service.domain.toLowerCase();
      if (!seenKeys.has(key) && !seenKeys.has(domainLower)) {
        seenKeys.add(key);
        seenKeys.add(domainLower);
        websiteItems.push({
          type: "website",
          title: service.name,
          url: service.url,
          domain: service.domain,
          badgeText: "Go to website",
          badgeClass: "website",
        });
      }
    }

    // D. Dynamic Universal Fallback (if no explicit URL, bookmark, or static registry matched):
    // If user types a single brand/company word (length >= 3, no spaces, not a stop word),
    // predict it as a direct website navigation item.
    if (websiteItems.length === 0 && !trimmed.includes(" ") && trimmed.length >= 3) {
      const inferred = inferWebsiteSuggestion(trimmed);
      if (inferred) {
        const key = normalizeUrl(inferred.url);
        const domainLower = inferred.domain.toLowerCase();
        if (!seenKeys.has(key) && !seenKeys.has(domainLower)) {
          seenKeys.add(key);
          seenKeys.add(domainLower);
          websiteItems.push({
            type: "website",
            title: inferred.name,
            url: inferred.url,
            domain: inferred.domain,
            badgeText: "Go to website",
            badgeClass: "website",
          });
        }
      }
    }

    return websiteItems.slice(0, 2);
  }

  async function fetchSearchSuggestions(query: string) {
    const trimmed = query.trim();
    if (!trimmed || trimmed !== input.value.trim()) return;

    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();
    const signal = abortController.signal;

    try {
      const url = `https://duckduckgo.com/ac/?q=${encodeURIComponent(trimmed)}&type=list`;
      const res = await fetch(url, { signal });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (signal.aborted || trimmed !== input.value.trim()) return;

      const searchStrings = parseDuckDuckGoSuggestions(data);
      let finalWebsiteItems = [...currentWebsiteMatches];

      // E. Dynamic Universal Discovery from DuckDuckGo top suggestion:
      // If still NO website match was found (e.g. user typed a partial prefix like 'ixi' or 'skys'
      // for a brand not in the static registry), inspect the top search suggestion!
      if (finalWebsiteItems.length === 0 && searchStrings.length > 0) {
        const topSuggestion = searchStrings[0].trim().toLowerCase();
        if (
          topSuggestion.startsWith(trimmed.toLowerCase()) &&
          !topSuggestion.includes(" ") &&
          topSuggestion.length >= 3 &&
          topSuggestion.length <= 25
        ) {
          const inferredFromDDG = inferWebsiteSuggestion(topSuggestion);
          if (inferredFromDDG) {
            finalWebsiteItems = [{
              type: "website",
              title: inferredFromDDG.name,
              url: inferredFromDDG.url,
              domain: inferredFromDDG.domain,
              badgeText: "Go to website",
              badgeClass: "website",
            }];
            currentWebsiteMatches = finalWebsiteItems;
          }
        }
      }

      const searchItems: AutocompleteItem[] = searchStrings
        .filter((s) => {
          const lower = s.toLowerCase().trim();
          for (const w of finalWebsiteItems) {
            const domainBase = w.domain.toLowerCase().replace(/\.[a-z]+$/i, "");
            if (
              w.domain.toLowerCase() === lower ||
              w.title.toLowerCase() === lower ||
              domainBase === lower
            ) {
              return false;
            }
          }
          return true;
        })
        .slice(0, 6)
        .map((s) => ({
          type: "search",
          query: s,
        }));

      suggestions = [...finalWebsiteItems, ...searchItems];
      selectedIndex = -1;
      renderSuggestions();
    } catch {
      if (signal.aborted) return;
      if (currentWebsiteMatches.length > 0) {
        suggestions = [...currentWebsiteMatches];
        renderSuggestions();
      } else {
        closeSuggestions();
      }
    }
  }

  function handleInput() {
    fit();
    lastTypedQuery = input.value;
    const val = input.value.trim();

    if (!val) {
      closeSuggestions();
      return;
    }

    // 1. INSTANT 0ms WEBSITE SUGGESTIONS: Display directly as you type!
    const websiteItems = getWebsiteMatches(val);
    currentWebsiteMatches = websiteItems;

    if (websiteItems.length > 0) {
      suggestions = [...websiteItems];
      selectedIndex = -1;
      renderSuggestions();
    }

    // 2. ULTRA-SNAPPY 60ms DEBOUNCED SEARCH FETCH:
    clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      fetchSearchSuggestions(val);
    }, 60);
  }

  input.addEventListener("input", handleInput);

  // Initialise composer
  fit();

  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    input.focus({ preventScroll: true });
  }

  input.addEventListener("focus", () => {
    enterFocusMode();
    refreshBookmarkedSites();
    const val = input.value.trim();
    if (val) {
      handleInput();
    }
  });

  input.addEventListener("click", () => {
    enterFocusMode();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      exitFocusMode();
      input.value = lastTypedQuery;
      input.blur();
      return;
    }

    const isOpen = suggestionsList.classList.contains("open") && suggestions.length > 0;

    if (isOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        updateSelection(selectedIndex + 1);
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        updateSelection(selectedIndex - 1);
        return;
      }

      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          selectItem(suggestions[selectedIndex]);
        } else {
          // If no item is selected, always perform a Brave search for the typed text
          submitSearch(input.value);
        }
        return;
      }
    } else {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        submitSearch(input.value);
        return;
      }
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
      selectItem(suggestions[selectedIndex]);
    } else {
      submitSearch(input.value);
    }
  });

  // Clicking outside exits focus mode without prematurely interrupting clicks inside form or suggestions
  document.addEventListener("pointerdown", (e) => {
    const target = e.target as Node | null;
    if (target && !form.contains(target)) {
      exitFocusMode();
    }
  });
}

export interface Choice {
  value: string;
  label: string;
  swatch?: string;
}

export function mountChoices(
  host: HTMLElement,
  choices: Choice[],
  current: string,
  onPick: (value: string) => void
) {
  const thumb = document.createElement("span");
  thumb.className = "thumb";
  thumb.setAttribute("aria-hidden", "true");
  host.append(thumb);

  const buttons = choices.map((c) => {
    const b = document.createElement("button");

    b.type = "button";
    b.setAttribute("role", "radio");
    b.dataset.value = c.value;

    const dot = c.swatch
      ? `<span class="dot" style="--swatch: ${c.swatch}" aria-hidden="true"></span>`
      : "";

    b.innerHTML = `${dot}<span>${c.label}</span>`;

    b.addEventListener("click", () => select(c.value, true));

    host.append(b);
    return b;
  });

  function place() {
    const b = buttons.find(
      (x) => x.getAttribute("aria-checked") === "true"
    );

    if (!b) return;

    thumb.style.translate = `${b.offsetLeft}px 0`;
    thumb.style.width = `${b.offsetWidth}px`;
  }

  function select(value: string, pick: boolean) {
    for (const b of buttons) {
      const on = b.dataset.value === value;

      b.setAttribute("aria-checked", String(on));
      b.tabIndex = on ? 0 : -1;

      if (on) {
        b.scrollIntoView({
          block: "nearest",
          inline: "nearest"
        });
      }
    }

    place();

    if (pick) onPick(value);
  }

  host.addEventListener("keydown", (e) => {
    const at = buttons.indexOf(
      document.activeElement as HTMLButtonElement
    );

    if (
      at < 0 ||
      (e.key !== "ArrowRight" && e.key !== "ArrowLeft")
    ) return;

    e.preventDefault();

    const next = buttons[
      (at + (e.key === "ArrowRight" ? 1 : -1) + buttons.length) %
      buttons.length
    ];

    next.focus();
    select(next.dataset.value!, true);
  });

  select(current, false);

  document.fonts?.ready.then(place);
  window.addEventListener("resize", place);
}