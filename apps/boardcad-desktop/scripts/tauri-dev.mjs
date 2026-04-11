/**
 * Prepends ~/.cargo/bin to PATH so `cargo` is found when the shell never picked up rustup.
 * On Windows, runs inside vcvars64.bat when available so MSVC's link.exe and LIB are set up
 * (fixes "linker `link.exe` not found" in Cursor and plain PowerShell).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const appRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const cargoBin = path.join(os.homedir(), ".cargo", "bin");
const sep = path.delimiter;

/** Must match `vite.config.ts` `server.port` and `src-tauri/tauri.conf.json` `build.devUrl`. */
const TAURI_DEV_PORT = 1420;

/** Stop processes listening on `port` (stale `vite` / `tauri dev` leaves 1420 busy). */
function killListenersOnPortWindows(port) {
  const script = [
    "$ErrorActionPreference = 'SilentlyContinue'",
    `$ids = Get-NetTCPConnection -LocalPort ${port} -State Listen | Select-Object -ExpandProperty OwningProcess -Unique`,
    "if ($ids) { $ids | ForEach-Object { Stop-Process -Id $_ -Force } }",
  ].join("; ");
  spawnSync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script],
    { stdio: "ignore", windowsHide: true }
  );
}

function findVcVars64Bat() {
  if (process.platform !== "win32") return null;
  const pf86 =
    process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
  const vswhere = path.join(
    pf86,
    "Microsoft Visual Studio",
    "Installer",
    "vswhere.exe"
  );
  if (!fs.existsSync(vswhere)) return null;

  const runVsWhere = (extraArgs) =>
    spawnSync(vswhere, extraArgs, { encoding: "utf8" });

  let install = runVsWhere([
    "-latest",
    "-products",
    "*",
    "-requires",
    "Microsoft.VisualStudio.Component.VC.Tools.x86.x64",
    "-property",
    "installationPath",
  ]).stdout?.trim();

  if (!install) {
    install = runVsWhere([
      "-latest",
      "-products",
      "*",
      "-property",
      "installationPath",
    ]).stdout?.trim();
  }

  if (!install) return null;
  const bat = path.join(install, "VC", "Auxiliary", "Build", "vcvars64.bat");
  return fs.existsSync(bat) ? bat : null;
}

/** Escape `"` and `%` for lines written into a .cmd file (batch rules). */
function escapeForCmdFile(s) {
  return s.replace(/%/g, "%%").replace(/"/g, '""');
}

/**
 * Avoid passing a long `call "…\vcvars64.bat" && …` string as cmd /c argv — Node's
 * Windows argument quoting can produce `\"…\"` and break `call`. A temp .cmd is reliable.
 */
function runWinWithVcvars(vcvarsBat) {
  const wrapper = path.join(
    os.tmpdir(),
    `ripple-tauri-dev-${process.pid}-${Date.now()}.cmd`
  );
  const body = [
    "@echo off",
    `call "${escapeForCmdFile(vcvarsBat)}"`,
    `set "PATH=${escapeForCmdFile(cargoBin)};%PATH%"`,
    `cd /d "${escapeForCmdFile(appRoot)}"`,
    "npx tauri dev",
  ].join("\r\n");

  fs.writeFileSync(wrapper, body, "utf8");
  try {
    return spawnSync("cmd.exe", ["/d", "/s", "/c", wrapper], {
      stdio: "inherit",
      env: process.env,
    });
  } finally {
    try {
      fs.unlinkSync(wrapper);
    } catch {
      // ignore
    }
  }
}

function runDefault() {
  const env = {
    ...process.env,
    PATH: `${cargoBin}${sep}${process.env.PATH ?? ""}`,
  };
  return spawnSync("npx", ["tauri", "dev"], {
    stdio: "inherit",
    shell: true,
    env,
    cwd: appRoot,
  });
}

const vcvars = findVcVars64Bat();
let result;

if (process.platform === "win32") {
  killListenersOnPortWindows(TAURI_DEV_PORT);
}

if (vcvars) {
  result = runWinWithVcvars(vcvars);
} else {
  if (process.platform === "win32") {
    console.error(
      "ripple-desktop: MSVC C++ build tools not detected (vcvars64.bat missing).\n" +
        "Install Visual Studio 2022 Build Tools with the C++ workload, then run again.\n" +
        "Example:\n" +
        '  winget install --id Microsoft.VisualStudio.2022.BuildTools -e --accept-package-agreements --accept-source-agreements --override "--wait --passive --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"\n'
    );
  }
  result = runDefault();
}

process.exit(result.status ?? 1);
