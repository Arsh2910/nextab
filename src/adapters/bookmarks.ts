/**
 * Universal bookmarks adapter.
 * Handles Promise (Firefox/W3C) and callback (Chromium) patterns without double-invoking,
 * and safely returns empty sets in environments lacking bookmarks support (such as Safari).
 */

import { getBrowser } from "./browser";
import { hasBookmarksApi } from "./capabilities";

export interface BookmarkNode {
  id: string;
  title: string;
  url?: string;
  children?: BookmarkNode[];
}

/**
 * Retrieves the full bookmarks tree safely.
 */
export async function getBookmarksTree(): Promise<BookmarkNode[]> {
  if (!hasBookmarksApi()) return [];

  const b = getBrowser();
  const api = b?.bookmarks;
  if (!api?.getTree) return [];

  // Check if browser.bookmarks.getTree returns a Promise natively (Firefox)
  const nativeBrowser = (globalThis as any).browser;
  if (typeof nativeBrowser?.bookmarks?.getTree === "function") {
    try {
      const tree = await nativeBrowser.bookmarks.getTree();
      return Array.isArray(tree) ? tree : [];
    } catch {
      return [];
    }
  }

  // Fallback to callback-based invocation (Chromium)
  return new Promise<BookmarkNode[]>((resolve) => {
    try {
      api.getTree((tree: BookmarkNode[]) => {
        resolve(Array.isArray(tree) ? tree : []);
      });
    } catch {
      resolve([]);
    }
  });
}

/**
 * Removes a bookmark by its ID.
 */
export async function removeBookmark(id: string): Promise<boolean> {
  if (!hasBookmarksApi()) return false;

  const b = getBrowser();
  const api = b?.bookmarks;
  if (!api?.remove) return false;

  const nativeBrowser = (globalThis as any).browser;
  if (typeof nativeBrowser?.bookmarks?.remove === "function") {
    try {
      await nativeBrowser.bookmarks.remove(id);
      return true;
    } catch {
      return false;
    }
  }

  return new Promise<boolean>((resolve) => {
    try {
      api.remove(id, () => {
        const err = b?.runtime?.lastError;
        resolve(!err);
      });
    } catch {
      resolve(false);
    }
  });
}

/**
 * Subscribes to bookmark mutation events (create, remove, update, move) if available.
 * Returns an unsubscribe callback for cleanup.
 */
export function addBookmarkListener(callback: () => void): () => void {
  if (!hasBookmarksApi()) return () => {};

  const b = getBrowser();
  const api = b?.bookmarks;
  if (!api) return () => {};

  try {
    api.onCreated?.addListener(callback);
    api.onRemoved?.addListener(callback);
    api.onChanged?.addListener(callback);
    api.onMoved?.addListener(callback);
  } catch {}

  return () => {
    try {
      api.onCreated?.removeListener(callback);
      api.onRemoved?.removeListener(callback);
      api.onChanged?.removeListener(callback);
      api.onMoved?.removeListener(callback);
    } catch {}
  };
}
