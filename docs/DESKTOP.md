# Windows desktop app

The laptop shell is a real Electron window around the existing Next.js Agentic OS. It preserves all local API routes and avoids a second UI implementation, Rust, cloud hosting, and paid tooling.

## Start

Double-click `Agentic OS - Laptop starten.cmd` in the project folder. If the local preview is already ready on `localhost:3000`, the shell safely reuses that exact origin. Otherwise it starts its own loopback-only Agentic OS server on `127.0.0.1:3210`, waits for it, and opens the application in a dedicated desktop window. Closing the window stops only a server started by that shell; an already running preview stays untouched.

## Security boundary

- renderer context isolation enabled;
- renderer Node integration disabled;
- Chromium sandbox and web security enabled;
- permission requests denied by default;
- popups, webviews, and top-level navigation guarded;
- only the loopback Agentic OS origin stays inside the window;
- external HTTPS links open outside the shell;
- no credentials, accounts, updates, telemetry service, or cloud dependency added.

Verified locally on Windows ARM: Electron ARM64 dependency installation, static security contract, JavaScript syntax, automatic local server start, and a visible development-window load titled `Agentic OS — Personal Life Operating System`. This phase does **not** claim a signed installer or packaged production executable; that would be a later separately verified distribution step.

## Optional daily startup boundary

No Windows startup entry, service, sleep-policy change, or Tailscale Run Unattended setting is enabled automatically. Reliable unattended access while Emre is away requires his explicit approval for a reversible Windows startup entry and any administrator confirmation requested by Tailscale. The laptop must remain powered, awake, and connected.
