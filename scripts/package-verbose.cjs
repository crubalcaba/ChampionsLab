// Runs `next build && electron-builder` with verbose logging so you can
// track progress instead of staring at long quiet phases (asar pack, LZMA
// compression, NSIS compose).
//
//   npm run package:verbose                  -> NSIS installer (default)
//   npm run package:verbose -- --portable    -> portable exe
//
// Override the debug filter by setting DEBUG before invoking:
//
//   PowerShell:  $env:DEBUG = "electron-builder"; npm run package:verbose
//   cmd.exe:     set DEBUG=electron-builder & npm run package:verbose
//   bash/zsh:    DEBUG=electron-builder npm run package:verbose
//
// Useful filters:
//   "electron-builder"                          - top-level steps only
//   "electron-builder*"                         - every sub-namespace (default)
//   "electron-builder*,app-builder*"            - + app-builder-lib internals
//   "electron-builder*,!electron-builder:hash"  - everything except hashing chatter

const { spawn } = require("node:child_process");
const path = require("node:path");

const DEBUG_FILTER = process.env.DEBUG || "electron-builder*";

// `npm run package:verbose -- --portable` -> portable target instead of nsis
const wantPortable = process.argv.slice(2).includes("--portable");
const target = wantPortable ? "portable" : "nsis";

const electronBuilderBin = path.join(
  __dirname,
  "..",
  "node_modules",
  ".bin",
  process.platform === "win32" ? "electron-builder.cmd" : "electron-builder",
);
const npmBin = process.platform === "win32" ? "npm.cmd" : "npm";

const childEnv = {
  ...process.env,
  DEBUG: DEBUG_FILTER,
  DEBUG_COLORS: process.env.DEBUG_COLORS ?? "true",
  FORCE_COLOR: "1",
};

function run(cmd, args, label) {
  return new Promise((resolve, reject) => {
    console.log(`\n[verbose-package] \u25B6 ${label}: ${cmd} ${args.join(" ")}\n`);
    const child = spawn(cmd, args, {
      stdio: "inherit",
      env: childEnv,
      cwd: path.join(__dirname, ".."),
      // Node 20+ refuses to spawn .cmd/.bat shims without a shell on Windows
      // (CVE-2024-27980 hardening -> EINVAL). Safe here: all args are static.
      shell: process.platform === "win32",
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} exited with code ${code}`));
    });
  });
}

(async () => {
  const t0 = Date.now();
  try {
    await run(npmBin, ["run", "build"], "next build");
    await run(
      electronBuilderBin,
      ["--win", target, "--x64"],
      `electron-builder (${target}, verbose)`,
    );
    const dur = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`\n[verbose-package] \u2713 done in ${dur}s (target=${target})`);
  } catch (err) {
    console.error(`\n[verbose-package] \u2717 ${err.message}`);
    process.exit(1);
  }
})();

