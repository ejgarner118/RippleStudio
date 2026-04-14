import { readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const assetsDir = path.join(root, "dist", "assets");
const maxBytes = 950 * 1024;

function bytes(n) {
  return `${(n / 1024).toFixed(1)} KiB`;
}

const files = readdirSync(assetsDir).filter((name) => name.endsWith(".js"));
let failed = false;

for (const file of files) {
  const full = path.join(assetsDir, file);
  const size = statSync(full).size;
  if (size > maxBytes) {
    console.error(`Bundle too large: ${file} is ${bytes(size)} (limit ${bytes(maxBytes)})`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log("Bundle size check passed.");
