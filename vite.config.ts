import { defineConfig } from "vite";
import fs from "node:fs";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const target = mode === "firefox" || mode === "safari" ? mode : "chrome";
  const manifestSource =
    target === "firefox"
      ? "manifests/manifest.firefox.json"
      : target === "safari"
        ? "manifests/manifest.safari.json"
        : "manifests/manifest.chromium.json";

  const outDir = `dist/${target}`;

  return {
    build: {
      outDir,
      emptyOutDir: true,
    },
    plugins: [
      {
        name: "copy-target-manifest",
        closeBundle() {
          const destManifest = path.resolve(outDir, "manifest.json");
          const srcManifest = path.resolve(manifestSource);
          if (fs.existsSync(srcManifest)) {
            fs.copyFileSync(srcManifest, destManifest);
          }
        },
      },
    ],
  };
});
