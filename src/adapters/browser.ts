/**
 * Universal browser namespace bridge.
 * Detects standard WebExtension `browser` or Chromium `chrome` safely.
 */

export function getBrowser(): any {
  if (typeof globalThis !== "undefined") {
    if ((globalThis as any).browser) return (globalThis as any).browser;
    if ((globalThis as any).chrome) return (globalThis as any).chrome;
  }
  return undefined;
}
