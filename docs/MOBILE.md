# iPhone companion with Expo Go

This is the free initial iPhone path. It uses the existing responsive Agentic OS interface as its only product UI, so mobile and laptop do not drift apart. It does not create an Expo/EAS account, public tunnel, cloud build, hosted deployment, or paid service.

The mobile product uses four permanent daily destinations—**Heute**, **Leben**, **Projekte**, and **Planung**—plus a compact **Mehr** menu for **Agenten & Skills**, **Wissen**, **Verbindungen**, and **Einstellungen**. Inbox, Journal, Chats, Skills, runtime evidence, and system progress are not separate mobile destinations. Tasks, habits, projects, life areas, planning, and agents remain implemented only in the shared Next.js application.

## Start in four steps

1. Install **Expo Go** once from the iPhone App Store.
2. Connect the iPhone and Windows laptop to the same Wi-Fi.
3. In the project folder, double-click `Agentic OS - iPhone starten.cmd`.
4. Keep that window open and scan its QR code with the iPhone camera or Expo Go.

The launcher detects the laptop's current LAN IPv4 address, starts Next.js on the local network, supplies the non-secret URL to Expo, and starts Expo in LAN mode. It never commits the machine IP. If Windows Firewall asks, allow Node.js only on **private networks**.

## If the phone cannot connect

- Confirm both devices use the same Wi-Fi; guest networks often isolate devices.
- Temporarily disable a VPN on either device.
- Confirm the laptop is awake and the launcher window is still open.
- Confirm Windows classifies the Wi-Fi as private and permits Node.js on private networks.
- Close the launcher with `Ctrl+C`, reopen it, and scan the fresh QR code.

## Configuration and safety

`apps/mobile/.env.example` documents `EXPO_PUBLIC_AGENTIC_OS_URL`. This value is public app configuration, never a secret. The launch helper sets it only for the current process. The WebView only treats the configured local origin as internal; external HTTPS navigation leaves the shell. Branded setup, loading, offline, and retry screens explain failures without claiming a connection.

Verified locally: SDK 54 Expo Go project structure, TypeScript, Expo lint, static web export, and responsive checks at 375×667, 390×844, 430×932, and 844×390. The checks cover navigation reachability, 44-pixel touch targets, horizontal overflow, the Quick Capture position, the secondary menu, and portrait/landscape shell behavior. A prior physical iPhone launch over LAN proves network/runtime compatibility; device-specific visual differences can still require a focused device check. No iOS binary or installer has been produced.

For private access away from home, see `REMOTE-ACCESS.md`. The optional Tailscale helper supplies a verified private HTTPS/MagicDNS URL to the same WebView and advertises Metro on the laptop's Tailscale IP. It never creates a public tunnel.
