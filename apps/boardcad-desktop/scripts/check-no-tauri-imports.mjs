import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const srcRoot = path.resolve(process.cwd(), "src");
const offenders = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.(ts|tsx|js|jsx)$/.test(entry.name)) continue;
    const content = readFileSync(full, "utf8");
    if (content.includes("@tauri-apps/")) offenders.push(full);
  }
}

if (!statSync(srcRoot).isDirectory()) {
  console.error(`Missing source directory: ${srcRoot}`);
  process.exit(1);
}

walk(srcRoot);

if (offenders.length > 0) {
  console.error("Found forbidden @tauri-apps imports in web target:");
  for (const file of offenders) console.error(`- ${path.relative(process.cwd(), file)}`);
  process.exit(1);
}

console.log("No @tauri-apps imports found in src.");
