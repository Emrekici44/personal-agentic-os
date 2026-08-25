# Obsidian guarded adapter

The authorized vault is treated as the human-readable knowledge source. The first live connection is deliberately read-only and is configured only in the local server environment with `AGENTIC_OS_OBSIDIAN_VAULT`. The committed example contains no personal path, note, attachment, or index output.

## What the preview reads

- Markdown files only, with a 5,000-note and 2 MiB-per-note safety bound;
- relative path and title;
- frontmatter key names and an internal title value when present;
- local wiki links and Markdown links to `.md` files;
- file modification time for local health evidence;
- top-level section counts and resolved note-to-note relationships.

The UI receives metadata, counts, and relationships. It does not receive note bodies or frontmatter values. No note body is logged or added to screenshots.

## What is excluded

`.obsidian`, trash, caches, `.git`, `node_modules`, attachments/assets, non-Markdown files, symbolic links, and oversized notes are excluded. The adapter follows no symbolic link and exposes no absolute vault path through its health endpoint.

## Controlled actions

The read-only index remains unchanged. The legacy normalization service can prepare two encrypted review artifacts without writing to the vault:

- a complete new Markdown note under the fixed `00 Agentic OS/Inbox` or `00 Agentic OS/System` boundary; or
- missing stable frontmatter for one note selected from the current read-only index, with its body guaranteed byte-for-byte unchanged.

Each artifact binds the current note count, a normalized relative `.md` path inside the configured vault, symlink rejection, expected SHA-256 file state, conflict result, exact diff, backup manifest and manual restore strategy. Content and target path are encrypted in the ignored operational store. Audit entries contain only proposal type, state, conflict flag and write counters.

The 15-minute normalization token is stored only as a hash. The exact phrase `OBSIDIAN DIFF FREIGEBEN` can move that legacy preview to `approved_pending_apply`; it still cannot apply.

Separately, `/api/obsidian/actions` provides exact, single-note `.md` create/update/delete actions. It accepts no arbitrary filesystem operation. Every action stays inside the configured Vault, rejects traversal/absolute paths/symlinks/unsupported extensions, binds an exact payload and one target to a single-use approval, and requires action-time confirmation. Create requires absence. Update/delete require the current SHA-256 hash; update/delete also create a recovery copy under ignored local state. Delete cannot be scheduled, batched or retried automatically after an unknown outcome. Receipts include only bounded target/hash/backup evidence, never the complete note body.

## Local launch

The Windows launch helpers set the authorized default under `%USERPROFILE%` only when that folder exists. A different vault can be selected by setting `AGENTIC_OS_OBSIDIAN_VAULT` outside source control before launch. The application reports `Unconfigured` or `Degraded` without revealing the local path when the adapter cannot read it.
