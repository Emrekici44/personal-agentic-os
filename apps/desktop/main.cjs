const { app, BrowserWindow, shell, session } = require("electron");
const { spawn, spawnSync } = require("node:child_process");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "../..");
const port = Number.parseInt(process.env.AGENTIC_OS_DESKTOP_PORT || "3210", 10);
let localOrigin = `http://127.0.0.1:${port}`;
let mainWindow;
let webProcess;
let isQuitting = false;

function isAllowedLocalUrl(value) {
  try {
    return new URL(value).origin === localOrigin;
  } catch {
    return false;
  }
}

function openExternalIfSafe(value) {
  try {
    const url = new URL(value);
    if (url.protocol === "https:") void shell.openExternal(url.toString());
  } catch {
    // Invalid external navigation is intentionally ignored.
  }
}

function startWebServer() {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  webProcess = spawn(npmCommand, ["run", "dev:desktop-web"], {
    cwd: projectRoot,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  webProcess.stdout?.on("data", (chunk) => process.stdout.write(`[web] ${chunk}`));
  webProcess.stderr?.on("data", (chunk) => process.stderr.write(`[web] ${chunk}`));
  webProcess.on("exit", (code) => {
    if (!isQuitting && mainWindow && !mainWindow.isDestroyed()) {
      void mainWindow.loadFile(path.join(__dirname, "loading.html"), {
        query: { state: "stopped", code: String(code ?? "unknown") },
      });
    }
  });
}

async function waitForServer(timeoutMs = 45_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(localOrigin, { redirect: "manual" });
      if (response.status >= 200 && response.status < 500) return;
    } catch {
      // The local server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  throw new Error("Local Agentic OS server did not become ready in time.");
}

async function serverIsReady(origin) {
  try {
    const response = await fetch(origin, { redirect: "manual" });
    return response.status >= 200 && response.status < 500;
  } catch {
    return false;
  }
}

function stopWebServer() {
  if (!webProcess?.pid || webProcess.killed) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(webProcess.pid), "/t", "/f"], {
      stdio: "ignore",
      windowsHide: true,
    });
  } else {
    webProcess.kill("SIGTERM");
  }
}

function protectWindow(window) {
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedLocalUrl(url)) void window.loadURL(url);
    else openExternalIfSafe(url);
    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, url) => {
    if (isAllowedLocalUrl(url)) return;
    event.preventDefault();
    openExternalIfSafe(url);
  });

  window.webContents.on("will-attach-webview", (event) => event.preventDefault());
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    autoHideMenuBar: true,
    backgroundColor: "#030812",
    height: 900,
    minHeight: 680,
    minWidth: 980,
    show: false,
    title: "Agentic OS",
    width: 1440,
    webPreferences: {
      contextIsolation: true,
      devTools: !app.isPackaged,
      navigateOnDragDrop: false,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
      sandbox: true,
      spellcheck: false,
      webSecurity: true,
    },
  });

  protectWindow(mainWindow);
  await mainWindow.loadFile(path.join(__dirname, "loading.html"));
  mainWindow.show();

  try {
    const sharedPreviewOrigin = "http://localhost:3000";
    if (await serverIsReady(sharedPreviewOrigin)) {
      localOrigin = sharedPreviewOrigin;
    } else {
      startWebServer();
      await waitForServer();
    }
    await mainWindow.loadURL(localOrigin);
    console.log(`[desktop] Agentic OS loaded securely from ${localOrigin}`);
  } catch (error) {
    await mainWindow.loadFile(path.join(__dirname, "loading.html"), {
      query: { state: "error", message: error instanceof Error ? error.message : "Unknown error" },
    });
  }
}

const hasLock = app.requestSingleInstanceLock();
if (!hasLock) app.quit();

app.whenReady().then(async () => {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  await createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });
});

app.on("second-instance", () => {
  if (mainWindow?.isMinimized()) mainWindow.restore();
  mainWindow?.focus();
});

app.on("before-quit", () => {
  isQuitting = true;
  stopWebServer();
});

app.on("window-all-closed", () => app.quit());
