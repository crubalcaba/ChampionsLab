// Champions Lab — Electron main process
//
// Wraps the static Next.js export (./out/) in a desktop window.
// The app is 100% client-rendered, no Node-side IPC needed.
//
// We register a custom `app://` protocol scheme instead of using `file://`,
// because file:// resolves root-relative asset paths (e.g. /_next/foo.js)
// against the drive root, not the HTML's directory. The `app://` handler
// maps every request straight into the out/ directory.

const { app, BrowserWindow, shell, Menu, protocol } = require("electron");
const path = require("node:path");
const { existsSync, statSync } = require("node:fs");
const { readFile } = require("node:fs/promises");

// --- single instance lock ---------------------------------------------------

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}

// --- privileged scheme registration (must run before app.ready) -------------

protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      bypassCSP: false,
    },
  },
]);

// --- config -----------------------------------------------------------------

const IS_DEV = process.env.ELECTRON_DEV === "1";
const OUT_DIR = path.join(__dirname, "..", "out");

let mainWindow = null;

// --- helpers ----------------------------------------------------------------

function guessMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".html": return "text/html; charset=utf-8";
    case ".js":
    case ".mjs":  return "application/javascript; charset=utf-8";
    case ".css":  return "text/css; charset=utf-8";
    case ".json": return "application/json; charset=utf-8";
    case ".png":  return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".gif":  return "image/gif";
    case ".webp": return "image/webp";
    case ".svg":  return "image/svg+xml";
    case ".ico":  return "image/x-icon";
    case ".woff2": return "font/woff2";
    case ".woff": return "font/woff";
    case ".ttf":  return "font/ttf";
    case ".otf":  return "font/otf";
    case ".txt":  return "text/plain; charset=utf-8";
    case ".xml":  return "application/xml; charset=utf-8";
    default:      return "application/octet-stream";
  }
}

async function serveFile(filePath) {
  const buf = await readFile(filePath);
  return new Response(buf, { headers: { "content-type": guessMime(filePath) } });
}

// Resolve a request pathname (relative to out/) to an actual file on disk,
// with SPA directory → index.html and 404 fallbacks.
function resolveTarget(pathname) {
  let rel = decodeURIComponent(pathname.replace(/^\/+/, ""));
  rel = rel.split("?")[0].split("#")[0];
  if (rel === "" || rel === "/") return path.join(OUT_DIR, "index.html");

  const direct = path.join(OUT_DIR, rel);
  if (existsSync(direct)) {
    const st = statSync(direct);
    if (st.isFile()) return direct;
    if (st.isDirectory()) {
      const indexed = path.join(direct, "index.html");
      if (existsSync(indexed)) return indexed;
    }
  }

  // Clean URL without trailing slash (e.g. /team-builder)
  const withIndex = path.join(OUT_DIR, rel, "index.html");
  if (existsSync(withIndex)) return withIndex;

  // Last resort: 404 page emitted by Next
  const notFound = path.join(OUT_DIR, "404.html");
  if (existsSync(notFound)) return notFound;

  return path.join(OUT_DIR, "index.html");
}

// --- window -----------------------------------------------------------------

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 720,
    backgroundColor: "#0c4a6e",
    title: "Champions Lab",
    icon: path.join(__dirname, "..", "public", "icon-512.png"),
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  Menu.setApplicationMenu(null);

  // External http(s) links open in the system browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (/^https?:\/\//i.test(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  if (IS_DEV) {
    mainWindow.loadURL("http://localhost:3000/");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    // Origin is `app://.` (the dot is just the placeholder hostname).
    mainWindow.loadURL("app://./index.html");
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// --- app lifecycle ----------------------------------------------------------

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  protocol.handle("app", async (request) => {
    try {
      const url = new URL(request.url);
      const target = resolveTarget(url.pathname);
      return await serveFile(target);
    } catch (err) {
      console.error("[app://] failed to serve", request.url, err);
      return new Response("Internal error", { status: 500 });
    }
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

