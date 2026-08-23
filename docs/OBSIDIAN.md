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

## Write boundary

The adapter imports no write, rename, move, delete, or overwrite operation. `writesEnabled` is always `false`; the UI visibly states that a future write requires an exact diff, explicit user approval, audit entry, and backup. That future synchronization workflow is not implied by this read-only connection.

## Local launch

The Windows launch helpers set the authorized default under `%USERPROFILE%` only when that folder exists. A different vault can be selected by setting `AGENTIC_OS_OBSIDIAN_VAULT` outside source control before launch. The application reports `Unconfigured` or `Degraded` without revealing the local path when the adapter cannot read it.
