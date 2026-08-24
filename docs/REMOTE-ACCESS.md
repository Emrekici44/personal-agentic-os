# Private access from iPhone with Tailscale

This is the no-cost private remote path. Tailscale Personal connects the Windows laptop and iPhone inside one authenticated tailnet. `tailscale serve` terminates private HTTPS on the laptop's MagicDNS name and proxies only to the loopback Agentic OS server. **Funnel, router port forwarding, and public tunnels are not used.**

Official references: [Personal pricing](https://tailscale.com/pricing), [Serve examples](https://tailscale.com/docs/reference/examples/serve), [connect devices](https://tailscale.com/kb/1452/connect-to-devices), and [Windows Run Unattended](https://tailscale.com/docs/how-to/run-unattended).

## First connection

1. Sign in to the official Tailscale app on Windows and iPhone with the same personal tailnet.
2. On iPhone, approve the Tailscale VPN profile and leave Tailscale connected.
3. Run `npm run build` once in the project.
4. Double-click `Agentic OS - Privat unterwegs starten.cmd` on the laptop.
5. The helper starts a production Next server on `127.0.0.1:3211`, configures private HTTPS Serve, verifies the MagicDNS URL, and prints that URL. It never calls `tailscale funnel`.
6. For Expo Go development over Tailscale, double-click `Agentic OS - iPhone Tailscale starten.cmd`. It obtains the current Tailscale IPv4 and MagicDNS name from the signed-in client, supplies the private HTTPS URL to the WebView, and advertises Metro on the private Tailscale IP.

Before showing a QR code, the iPhone helper now verifies that a real Next.js JavaScript asset is accepted from the exact private MagicDNS origin. This prevents a misleading state where server-rendered HTML is visible but every control is inert because a development server rejected the private origin. The Expo shell also waits for a content-free `agentic-os-ready` signal from the hydrated app instead of treating HTML load alone as success.

No IP, MagicDNS name, account identifier, or secret is committed. `EXPO_PUBLIC_AGENTIC_OS_URL` is public runtime configuration, not a credential. The Tailscale access policy remains the authorization boundary.

## One honest remote test

Keep the laptop plugged in, awake, and connected to Tailscale. On iPhone, keep Tailscale connected, turn Wi-Fi off, then reopen the Expo Go project over cellular. Remote access is not considered verified until this test succeeds and the user confirms it.

Expo Go is a development runtime: Metro must remain running and reachable. A standalone iPhone binary would require a separately approved Apple/Expo build path and is not claimed here.

## Windows availability

The helpers do not alter Windows sleep or power settings. The user must deliberately keep the laptop awake and plugged in. Tailscale's **Run Unattended** setting can keep Tailscale connected when nobody is logged in, but it may require Windows administrator confirmation. Enable it manually from Tailscale tray icon → Preferences → Run Unattended only if desired.

## Stop and reverse

Double-click `Agentic OS - Privat stoppen.cmd` to stop only the Agentic OS loopback server that the helper started. It deliberately does not run the broad `tailscale serve reset`, because that command could remove unrelated Serve rules. Without the backend, the Agentic OS endpoint does not serve application data. Remove a Serve rule later only after reviewing `tailscale serve status`.

## Current verification boundary

The official Windows ARM64 client is installed. Private Serve, MagicDNS HTTPS, the Tailscale Expo QR, and cellular access must remain labeled unverified until Windows reports `Running/Connected` and each check succeeds.
