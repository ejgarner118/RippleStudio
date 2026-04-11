import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const coreRoot = path.resolve(__dirname, "../../packages/boardcad-core/src");

const appVersion = (
  JSON.parse(
    readFileSync(new URL("./package.json", import.meta.url), "utf-8"),
  ) as { version: string }
).version;

export default defineConfig({
  plugins: [react()],
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion),
  },
  resolve: {
    alias: {
      "@boardcad/core": path.join(coreRoot, "index.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    passWithNoTests: true,
  },
});
