# Architecture

The browser client is the current local-first runtime. Modules use one shared state envelope for inbox items, approvals, preferences, and audit records. Settings can export this state as a portable backup.

The connector boundary is intentionally separate from planning logic. A connector exposes `connect`, `read`, `previewWrite`, `commitApprovedWrite`, and `disconnect`. Agents can read normalized calendar/task records and produce proposals, but only the approval service can issue a write token. Every token is single-use, scoped to a displayed change set, and recorded in audit history.

The knowledge adapter accepts a user-selected directory, inventories Markdown without writes, previews frontmatter/wiki-links/tags, and only then builds an application-owned index. Future hosted persistence should use an authenticated per-user database with encrypted secrets outside the database.
