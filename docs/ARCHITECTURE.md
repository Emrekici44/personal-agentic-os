# Architecture

The browser client is the current local-first runtime. Modules use one shared state envelope for inbox items, approvals, preferences, and audit records. Settings can export this state as a portable backup.

The connector boundary is intentionally separate from planning logic. A connector exposes `connect`, `read`, `previewWrite`, `commitApprovedWrite`, and `disconnect`. Agents can read normalized calendar/task records and produce proposals, but only the approval service can issue a write token. Every token is single-use, scoped to a displayed change set, and recorded in audit history.

The knowledge adapter accepts a user-selected directory, inventories Markdown without writes, previews frontmatter/wiki-links/tags, and only then builds an application-owned index. Future hosted persistence should use an authenticated per-user database with encrypted secrets outside the database.

Google Calendar routes are server-only. Credentials never enter the browser bundle. The callback encrypts the short-lived token into an HTTP-only cookie; calendar and event routes normalize Google records and enforce a bounded week. Proposal generation has no write capability. Approval requires an exact confirmation and 1–3 blocks; the mock adapter still records zero writes. Real Calendar commit logic and broader Google scope are deliberately absent until separately approved.

## Expanded application

The command center routes one shared local state into domain dashboards for faith, career, health, finance, relationships, and projects. Journal, tasks, habits, inbox, agents, skills, chats, integrations, and knowledge remain cross-domain services. Branding is preference data—not a schema identifier—so the temporary product name can change safely.

The model console has four honest states: subscription companion (organizes ChatGPT/Codex work without API claims), optional OpenAI Responses API, optional local model after runtime verification, and mock. The server-side provider guard rejects requests unless API mode, server key, positive spend ceilings, and a disabled kill switch are all explicit.

The Emre vault is the human-readable source of truth. Its additive numbered indexes use stable `type` and `schema_version` frontmatter and link to existing area notes without replacing them. Application writes remain preview → approval → audit. The built-in graph derives from frontmatter and Wikilinks. Graphify is non-core and limited to a future pinned TypeScript pilot on a non-sensitive copy with structural extraction only.
