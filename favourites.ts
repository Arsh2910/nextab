import { loadFavicon } from "./src/adapters/favicon";

const STORAGE_KEY = "ascii-animals:favourites";
const NAMES_KEY = "ascii-animals:favourite-names";
const TILE_VISIBLE_KEY = "ascii-animals:tile-visible";

interface Site {
  name: string;
  url: string;
}

const ADULT_DOMAINS = [
  "pornhub.com",
  "xvideos.com",
  "xnxx.com",
  "xhamster.com",
  "redtube.com",
  "youporn.com",
  "tube8.com",
  "spankbang.com",
  "chaturbate.com",
  "stripchat.com",
  "onlyfans.com",
  "xhamsterlive.com",
  "brazzers.com",
  "bangbros.com",
  "realitykings.com",
  "naughtyamerica.com",
  "adultfriendfinder.com",
  "rule34.xxx",
  "youjizz.com",
  "motherless.com",
  "xgroovy.com",
  "beeg.com",
  "tnaflix.com",
  "empflix.com",
  "eporner.com",
  "porn.com",
  "redgifs.com"
];

function readJSON<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Could not save ${key}`, error);
  }
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isAdultDomain(url: string): boolean {
  const hostname = hostnameOf(url);
  return ADULT_DOMAINS.some(
    domain => hostname === domain || hostname.endsWith(`.${domain}`)
  );
}

function iconFor(url: string, name?: string): HTMLImageElement {
  const icon = document.createElement("img");
  icon.alt = "";
  icon.loading = "lazy";
  loadFavicon(icon, url, undefined, name);
  return icon;
}

function actionButton(
  label: string,
  title: string,
  className: string
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.title = title;
  button.setAttribute("aria-label", title);
  button.textContent = label;
  return button;
}

export function mountFavourites() {
  const container = document.createElement("div");
  container.className = "favourites-container";

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className = "favourites-visibility-toggle";

  const section = document.createElement("section");
  section.className = "favourites glass";

  section.innerHTML = `
    <div class="favourites-header">
      <h2>Favourites</h2>
      <div class="favourites-actions">
        <button class="favourites-names" type="button">Hide Names</button>
        <button class="favourites-add" type="button">+ Add</button>
      </div>
    </div>
    <div class="favourites-list"></div>
  `;

  container.append(toggleBtn, section);
  document.body.append(container);

  const EYE_ICON_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const EYE_OFF_ICON_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>`;

  let isTileVisible = readJSON<boolean>(TILE_VISIBLE_KEY, true);

  function updateTileVisibility() {
    if (isTileVisible) {
      container.classList.remove("tile-hidden");
      toggleBtn.innerHTML = EYE_ICON_SVG;
      toggleBtn.title = "Hide Favourites";
      toggleBtn.setAttribute("aria-label", "Hide Favourites");
      toggleBtn.setAttribute("aria-expanded", "true");
    } else {
      container.classList.add("tile-hidden");
      toggleBtn.innerHTML = EYE_OFF_ICON_SVG;
      toggleBtn.title = "Show Favourites";
      toggleBtn.setAttribute("aria-label", "Show Favourites");
      toggleBtn.setAttribute("aria-expanded", "false");
    }
  }

  toggleBtn.addEventListener("click", () => {
    isTileVisible = !isTileVisible;
    writeJSON(TILE_VISIBLE_KEY, isTileVisible);
    updateTileVisibility();
  });

  updateTileVisibility();

  const list = section.querySelector<HTMLDivElement>(".favourites-list")!;
  const namesButton = section.querySelector<HTMLButtonElement>(".favourites-names")!;
  const addButton = section.querySelector<HTMLButtonElement>(".favourites-add")!;

  let favourites = readJSON<Site[]>(STORAGE_KEY, []);
  let showNames = readJSON<boolean>(NAMES_KEY, true);

  const saveFavourites = () => writeJSON(STORAGE_KEY, favourites);

  function renderEmpty(message: string) {
    const empty = document.createElement("p");
    empty.className = "favourites-empty";
    empty.textContent = message;
    list.append(empty);
  }

  function enableDragging(
    card: HTMLDivElement,
    index: number,
    sites: Site[],
    save: () => void
  ) {
    card.draggable = true;

    card.addEventListener("dragstart", event => {
      card.classList.add("is-dragging");
      event.dataTransfer?.setData("text/plain", String(index));
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
      }
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("is-dragging");
      list.querySelectorAll(".favourite-item").forEach(item => {
        item.classList.remove("drag-over");
      });
    });

    card.addEventListener("dragover", event => {
      event.preventDefault();
      card.classList.add("drag-over");
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }
    });

    card.addEventListener("dragleave", () => {
      card.classList.remove("drag-over");
    });

    card.addEventListener("drop", event => {
      event.preventDefault();
      card.classList.remove("drag-over");

      const from = Number(event.dataTransfer?.getData("text/plain"));
      const to = index;

      if (
        !Number.isInteger(from) ||
        from < 0 ||
        from >= sites.length ||
        from === to
      ) {
        return;
      }

      const [moved] = sites.splice(from, 1);
      sites.splice(to, 0, moved);

      save();
      render();
    });
  }

  function render() {
    list.replaceChildren();

    section.classList.toggle("hide-names", !showNames);
    namesButton.textContent = showNames ? "Hide Names" : "Show Names";

    if (!favourites.length) {
      renderEmpty("No favourites yet. Click '+ Add' to save a website shortcut.");
      return;
    }

    favourites.forEach((site, index) => {
      const card = document.createElement("div");
      card.className = "favourite-item";
      card.dataset.domain = hostnameOf(site.url);

      const link = document.createElement("a");
      link.className = "favourite-link";
      link.href = site.url;
      link.title = site.name;
      link.draggable = false;

      link.append(iconFor(site.url, site.name));

      const label = document.createElement("span");
      label.textContent = site.name;

      link.append(label);
      card.append(link);

      const actions = document.createElement("div");
      actions.className = "favourite-item-actions";

      const remove = actionButton(
        "×",
        "Remove from Favourites",
        "favourite-remove"
      );

      remove.addEventListener("click", () => {
        favourites.splice(index, 1);
        saveFavourites();
        render();
      });

      actions.append(remove);
      enableDragging(card, index, favourites, saveFavourites);

      card.append(actions);
      list.append(card);
    });
  }

  namesButton.addEventListener("click", () => {
    showNames = !showNames;
    writeJSON(NAMES_KEY, showNames);
    render();
  });

  addButton.addEventListener("click", () => {
    const name = prompt("Website name:");
    if (!name?.trim()) return;

    let url = prompt("Website address (example: https://youtube.com):");
    if (!url?.trim()) return;

    url = url.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    try {
      const parsed = new URL(url);

      if (isAdultDomain(parsed.href)) {
        alert("This domain is blocked by the local adult-domain filter.");
        return;
      }

      if (
        favourites.some(
          saved => hostnameOf(saved.url) === hostnameOf(parsed.href)
        )
      ) {
        alert("This website is already in Favourites.");
        return;
      }

      favourites.push({
        name: name.trim(),
        url: parsed.href
      });

      saveFavourites();
      render();
    } catch {
      alert("Please enter a valid website address.");
    }
  });

  render();
}
