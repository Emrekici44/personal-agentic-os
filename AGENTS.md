# Shared client rule

The Next.js application is the only product UI and domain source of truth. Electron and Expo must remain thin shells; never duplicate tasks, habits, projects, life areas, agents, planning, knowledge, connections, or settings inside a shell.

After any product, UI, runtime, integration, or shell change, run `npm run verify:all`. This verifies lint, tests, the production web build, Electron, Expo export/type/lint checks, private Tailscale HTTPS assets, private session issuance, and the shared store. Do not push when this command fails. Keep Funnel disabled and never commit credentials, machine IPs, MagicDNS names, local databases, or generated authentication secrets.
