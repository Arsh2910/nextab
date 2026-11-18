// Enable Chromium liquid-glass rendering via platform capability detection
import { supportsLiquidGlass } from "./src/adapters/capabilities";

if (supportsLiquidGlass()) {
  document.documentElement.classList.add("liquid");
}
