import "server-only";

import crypto from "node:crypto";
import { lstat, readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";

import { readVaultPreview } from "@/lib/obsidian-vault";

const allowedTypes = new Set(["system", "inbox", "project", "journal", "person", "research", "reflection"]);
const allowedPrivacy = new Set(["private", "sensitive", "system"]);
const allowedAreas = new Set(["", "faith", "career", "health", "finance", "relations", "projects"]);

const hash = (value: string) => crypto.createHash("sha256").update(value).digest("hex");
const quote = (value: string) => JSON.stringify(value);
const berlinDate = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const cleanTitle = (value: unknown) => {
  const title = String(value || "").trim();
  if (title.length < 2 || title.length > 100) throw new Error("Titel muss 2–100 Zeichen haben");
  return title;
};
const safeFilename = (title: string) => {
  const filename = title.replace(/[<>:"/\\|?*\u0000-\u001F]/g, " ").replace(/\s+/g, " ").replace(/[. ]+$/g, "").trim();
  if (!filename || /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i.test(filename)) throw new Error("Titel ergibt keinen sicheren Windows-Dateinamen");
  return filename.slice(0, 80);
};

async function vaultRoot() {
  const configured = process.env.AGENTIC_OS_OBSIDIAN_VAULT?.trim();
  if (!configured) throw new Error("Vault-Pfad ist nicht lokal konfiguriert");
  const root = await realpath(path.resolve(configured));
  if (!(await stat(root)).isDirectory()) throw new Error("Konfigurierter Vault ist kein Ordner");
  return root;
}

async function checkedTarget(relativePath: string) {
  const normalized = relativePath.replaceAll("\\", "/").replace(/^\/+/, "");
  if (!normalized.toLowerCase().endsWith(".md") || normalized.includes("\0")) throw new Error("Ziel muss eine Markdown-Datei sein");
  const root = await vaultRoot();
  const absolute = path.resolve(root, ...normalized.split("/"));
  const relative = path.relative(root, absolute);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Ziel liegt außerhalb des Vaults");
  let cursor = root;
  for (const segment of relative.split(path.sep).slice(0, -1)) {
    cursor = path.join(cursor, segment);
    try {
      if ((await lstat(cursor)).isSymbolicLink()) throw new Error("Symlink-Ziel ist nicht erlaubt");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") break;
      throw error;
    }
  }
  return { absolute, relativePath: relative.replaceAll("\\", "/"), root };
}

async function fileState(absolute: string) {
  try {
    const metadata = await stat(absolute);
    if (!metadata.isFile() || metadata.size > 2 * 1024 * 1024) throw new Error("Zieldatei ist nicht als kleine Markdown-Notiz lesbar");
    const contents = await readFile(absolute, "utf8");
    return { exists: true, hash: hash(contents), contents, size: metadata.size };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { exists: false, hash: null, contents: "", size: 0 };
    throw error;
  }
}

function backupAndRestore(relativePath: string, exists: boolean, expectedHash: string | null) {
  return {
    backupPlan: {
      requiredBeforeApply: true,
      destination: "local-state/backups/vault/<timestamp>/<relative-path>",
      manifest: "SHA-256, Zielpfad, Zeitpunkt und Aktion",
      sourcePath: relativePath,
      sourceExpectedHash: expectedHash,
      strategy: exists ? "changed-file copy + manifest before atomic replace" : "manifest marks newly created file",
      outsideGit: true,
      createdDuringPreview: false,
    },
    restorePlan: {
      verifiedBackupRequired: exists,
      strategy: exists ? "restore exact backup copy only after hash and path verification" : "remove only the exact newly created file after separate restore confirmation",
      automaticRestore: false,
      destructiveStepRequiresSeparateApproval: !exists,
    },
  };
}

export async function buildVaultWriteProposal(input: any) {
  const proposalType = String(input?.proposalType || "");
  if (!["new_system_note", "normalize_existing_note"].includes(proposalType)) throw new Error("Unbekannter Obsidian-Vorschlagstyp");
  const preview = await readVaultPreview();
  if (Number(input?.expectedNoteCount) !== preview.noteCount) throw new Error("Vault-Inventar hat sich geändert; Read-only Index zuerst neu prüfen");

  if (proposalType === "new_system_note") {
    const title = cleanTitle(input.title), body = String(input.body || "").trim();
    if (body.length < 2 || body.length > 10_000) throw new Error("Notizinhalt muss 2–10.000 Zeichen haben");
    const noteType = String(input.noteType || "inbox");
    if (!new Set(["inbox", "system"]).has(noteType)) throw new Error("Neue Systemnotiz muss Inbox oder System sein");
    const privacy = String(input.privacy || "private");
    if (!allowedPrivacy.has(privacy)) throw new Error("Ungültige Datenschutzklasse");
    const folder = noteType === "inbox" ? "00 Agentic OS/Inbox" : "00 Agentic OS/System";
    const target = await checkedTarget(`${folder}/${noteType === "inbox" ? `${berlinDate()} - ` : ""}${safeFilename(title)}.md`);
    const current = await fileState(target.absolute);
    const id = `aos-${crypto.randomUUID()}`, now = new Date().toISOString();
    const content = [`---`, `id: ${quote(id)}`, `type: ${quote(noteType)}`, `source: ${quote("agentic-os-approved-write")}`, `created: ${quote(now)}`, `updated: ${quote(now)}`, `status: ${quote("draft")}`, `privacy: ${quote(privacy)}`, `---`, "", `# ${title}`, "", body, ""].join("\n");
    const plans = backupAndRestore(target.relativePath, current.exists, current.hash);
    return {
      proposalType,
      targetPath: target.relativePath,
      operation: "create_new_markdown",
      conflict: current.exists,
      conflictReason: current.exists ? "Am Ziel existiert bereits eine Datei" : null,
      expectedState: { exists: false, hash: null },
      exactDiff: [`--- /dev/null`, `+++ ${target.relativePath}`, `@@ create ${content.split("\n").length} lines @@`, ...content.split("\n").map((line) => `+${line}`)].join("\n"),
      proposedContent: content,
      unchangedBodyGuaranteed: false,
      approvalPhrase: "OBSIDIAN DIFF FREIGEBEN",
      approvalClass: "vault_exact_diff",
      applyAvailable: false,
      writesPerformed: false,
      existingNotesModified: 0,
      indexedNoteCount: preview.noteCount,
      ...plans,
    };
  }

  const requestedPath = String(input.relativePath || "").replaceAll("\\", "/");
  const indexedNote = preview.notes.find((note) => note.relativePath === requestedPath);
  if (!indexedNote) throw new Error("Notiz ist nicht Teil des aktuellen Read-only Indexes");
  const target = await checkedTarget(indexedNote.relativePath), current = await fileState(target.absolute);
  if (!current.exists) throw new Error("Notiz existiert nicht mehr; Index neu laden");
  const type = String(input.noteType || "research"), privacy = String(input.privacy || "private"), lifeArea = String(input.lifeArea || "");
  if (!allowedTypes.has(type) || !allowedPrivacy.has(privacy) || !allowedAreas.has(lifeArea)) throw new Error("Ungültige Normalisierungsmetadaten");
  const additions: Record<string, string> = {
    id: `aos-${hash(target.relativePath).slice(0, 16)}`,
    type,
    source: "emre-vault-existing",
    created: indexedNote.modifiedAt,
    updated: new Date().toISOString(),
    status: "active",
    privacy,
  };
  if (lifeArea) additions.life_area = lifeArea;
  const missing = Object.entries(additions).filter(([key]) => !indexedNote.frontmatterKeys.includes(key));
  if (!missing.length) throw new Error("Für diese Notiz fehlen keine ausgewählten Metadaten");
  const exactDiff = [`--- ${target.relativePath} · sha256:${current.hash}`, `+++ ${target.relativePath} · proposed`, `@@ frontmatter only · body unchanged byte-for-byte @@`, ...missing.map(([key, value]) => `+${key}: ${quote(value)}`)].join("\n");
  const plans = backupAndRestore(target.relativePath, true, current.hash);
  return {
    proposalType,
    targetPath: target.relativePath,
    operation: "add_missing_frontmatter_only",
    conflict: false,
    conflictReason: null,
    expectedState: { exists: true, hash: current.hash, size: current.size },
    exactDiff,
    proposedMetadata: Object.fromEntries(missing),
    unchangedBodyGuaranteed: true,
    approvalPhrase: "OBSIDIAN DIFF FREIGEBEN",
    approvalClass: "vault_exact_diff",
    applyAvailable: false,
    writesPerformed: false,
    existingNotesModified: 0,
    indexedNoteCount: preview.noteCount,
    ...plans,
  };
}

export async function revalidateVaultWriteProposal(proposal: any) {
  const target = await checkedTarget(String(proposal.targetPath || ""));
  const current = await fileState(target.absolute), expected = proposal.expectedState || {};
  const conflict = current.exists !== Boolean(expected.exists) || (current.exists && current.hash !== expected.hash);
  return {
    conflict,
    expectedHash: expected.hash || null,
    currentHashMatches: !conflict,
    targetPathMatches: target.relativePath === proposal.targetPath,
    writesPerformed: false,
  };
}
