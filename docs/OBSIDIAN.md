# Obsidian read-only adapter

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

## Controlled write preparation

The read-only index remains unchanged. A separate signed private proposal API can prepare two encrypted review artifacts without writing to the vault:

- a complete new Markdown note under the fixed `00 Agentic OS/Inbox` or `00 Agentic OS/System` boundary; or
- missing stable frontmatter for one note selected from the current read-only index, with its body guaranteed byte-for-byte unchanged.

Each artifact binds the current note count, a normalized relative `.md` path inside the configured vault, symlink rejection, expected SHA-256 file state, conflict result, exact diff, backup manifest and manual restore strategy. Content and target path are encrypted in the ignored operational store. Audit entries contain only proposal type, state, conflict flag and write counters.

The 15-minute token is stored only as a hash. The exact phrase `OBSIDIAN DIFF FREIGEBEN` can move a conflict-free preview to `approved_pending_apply` after revalidation. This is not a write approval: `applyAvailable` remains false, no Apply endpoint exists, and the proposal module imports no write, copy, rename, delete or directory-creation primitive. A real apply remains a later user-controlled decision listed in `PENDING-DECISIONS.md`.

## Local launch

The Windows launch helpers set the authorized default under `%USERPROFILE%` only when that folder exists. A different vault can be selected by setting `AGENTIC_OS_OBSIDIAN_VAULT` outside source control before launch. The application reports `Unconfigured` or `Degraded` without revealing the local path when the adapter cannot read it.
