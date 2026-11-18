/**
 * Runtime platform capability detection.
 */

import { getBrowser } from "./browser";

/**
 * Returns true if the browser extension bookmarks API is available and accessible.
 * Safari does not support this API; Chromium and Firefox do.
 */
export function hasBookmarksApi(): boolean {
  const b = getBrowser();
  return Boolean(b?.bookmarks?.getTree);
}

/**
 * Returns true if the browser supports SVG filter displacement within backdrop-filter.
 * Only Chromium-based engines reliably support this without visual artifacts.
 */
export function supportsLiquidGlass(): boolean {
  if (typeof navigator !== "undefined" && typeof navigator.userAgent === "string") {
    // Chromium-based browsers (Chrome, Brave, Edge, Opera, Vivaldi)
    return /Chrome\//.test(navigator.userAgent) && !/Firefox\//.test(navigator.userAgent);
  }
  return false;
}
