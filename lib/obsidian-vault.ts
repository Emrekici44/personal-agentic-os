import "server-only";

import { readdir, readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";

const ignoredDirectories = new Set([
  ".obsidian",
  ".trash",
  ".git",
  ".cache",
  "node_modules",
  "attachments",
  "attachment",
  "anhänge",
  "anhaenge",
  "assets",
]);

const MAX_NOTES = 5_000;
const MAX_NOTE_BYTES = 2 * 1024 * 1024;

type Frontmatter = Record<string, string | number | boolean>;

export type VaultNotePreview = {
  frontmatterKeys: string[];
  links: string[];
  modifiedAt: string;
  relativePath: string;
  title: string;
};

export type VaultPreview = {
  approvalRequired: true;
  excluded: string[];
  frontmatterNoteCount: number;
  indexedAt: string;
  linkCount: number;
  noteCount: number;
  notes: VaultNotePreview[];
  readOnly: true;
  relationshipCount: number;
  relationships: Array<{ sensitive: boolean; source: string; target: string }>;
  rootLabel: string;
  sectionCounts: Array<{ count: number; section: string }>;
  skippedLargeFiles: number;
  status: "online";
  writesEnabled: false;
};

function parseScalar(raw: string): string | number | boolean {
  const value = raw.trim().replace(/^['"]|['"]$/g, "");
  if (/^(true|false)$/i.test(value)) return value.toLowerCase() === "true";
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return value;
}

function parseFrontmatter(contents: string): Frontmatter {
  if (!contents.startsWith("---\n") && !contents.startsWith("---\r\n")) return {};
  const normalized = contents.replaceAll("\r\n", "\n");
  const end = normalized.indexOf("\n---", 4);
  if (end < 0 || end > 16_000) return {};

  const result: Frontmatter = {};
  for (const line of normalized.slice(4, end).split("\n")) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (match) result[match[1]] = parseScalar(match[2]);
  }
  return result;
}

function extractLinks(contents: string): string[] {
  const links = new Set<string>();
  for (const match of contents.matchAll(/!?\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g)) {
    const target = match[1].trim();
    if (target) links.add(target.replaceAll("\\", "/"));
  }
  for (const match of contents.matchAll(/\[[^\]]*\]\(([^)#]+\.md)(?:#[^)]+)?\)/g)) {
    let target = match[1].trim();
    try {
      target = decodeURIComponent(target);
    } catch {
      // Keep malformed local link text as-is instead of failing the full index.
    }
    target = target.replaceAll("\\", "/");
    if (!/^https?:/i.test(target)) links.add(target);
  }
  return [...links];
}

async function collectMarkdownFiles(root: string, current = root): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(current, { withFileTypes: true })) {
    if (files.length >= MAX_NOTES || entry.isSymbolicLink()) continue;
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name.toLowerCase())) {
        files.push(...(await collectMarkdownFiles(root, absolute)));
      }
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      files.push(absolute);
    }
  }
  return files.slice(0, MAX_NOTES);
}

function normalizedStem(value: string): string {
  return value
    .replaceAll("\\", "/")
    .replace(/^\.\//, "")
    .replace(/\.md$/i, "")
    .toLocaleLowerCase("de-DE");
}

export function vaultConfigured(): boolean {
  return Boolean(process.env.AGENTIC_OS_OBSIDIAN_VAULT?.trim());
}

export async function readVaultPreview(): Promise<VaultPreview> {
  const configuredPath = process.env.AGENTIC_OS_OBSIDIAN_VAULT?.trim();
  if (!configuredPath) throw new Error("Vault-Pfad ist nicht lokal konfiguriert");

  const root = await realpath(path.resolve(configuredPath));
  const rootStats = await stat(root);
  if (!rootStats.isDirectory()) throw new Error("Konfigurierter Vault ist kein Ordner");

  const files = await collectMarkdownFiles(root);
  const notes: VaultNotePreview[] = [];
  let skippedLargeFiles = 0;

  for (const file of files) {
    const metadata = await stat(file);
    if (metadata.size > MAX_NOTE_BYTES) {
      skippedLargeFiles += 1;
      continue;
    }
    const contents = await readFile(file, "utf8");
    const relativePath = path.relative(root, file).replaceAll("\\", "/");
    const frontmatter = parseFrontmatter(contents);
    notes.push({
      frontmatterKeys: Object.keys(frontmatter).sort(),
      links: extractLinks(contents),
      modifiedAt: metadata.mtime.toISOString(),
      relativePath,
      title:
        typeof frontmatter.title === "string" && frontmatter.title.trim()
          ? frontmatter.title.trim()
          : path.basename(file, path.extname(file)),
    });
  }

  const byTarget = new Map<string, VaultNotePreview>();
  for (const note of notes) {
    byTarget.set(normalizedStem(note.relativePath), note);
    byTarget.set(normalizedStem(note.relativePath.split("/").at(-1) || note.title), note);
    byTarget.set(normalizedStem(note.title), note);
  }

  const relationships: Array<{ sensitive: boolean; source: string; target: string }> = [];
  for (const note of notes) {
    for (const rawTarget of note.links) {
      const resolved =
        byTarget.get(normalizedStem(rawTarget)) ||
        byTarget.get(normalizedStem(rawTarget.split("/").at(-1) || rawTarget));
      if (resolved && resolved.relativePath !== note.relativePath) {
        const sensitivePath = /^(Bereiche\/(Glaube|Finanzen|Beziehungen)|05 Menschen)(\/|$)/i;
        relationships.push({
          sensitive:
            sensitivePath.test(note.relativePath) || sensitivePath.test(resolved.relativePath),
          source: note.title,
          target: resolved.title,
        });
      }
    }
  }

  const sections = new Map<string, number>();
  for (const note of notes) {
    const section = note.relativePath.includes("/")
      ? note.relativePath.split("/")[0]
      : "Vault-Wurzel";
    sections.set(section, (sections.get(section) || 0) + 1);
  }

  return {
    approvalRequired: true,
    excluded: [".obsidian", ".trash", "caches", "attachments", "non-Markdown", "symlinks"],
    frontmatterNoteCount: notes.filter((note) => note.frontmatterKeys.length > 0).length,
    indexedAt: new Date().toISOString(),
    linkCount: notes.reduce((total, note) => total + note.links.length, 0),
    noteCount: notes.length,
    notes,
    readOnly: true,
    relationshipCount: relationships.length,
    relationships,
    rootLabel: path.basename(root),
    sectionCounts: [...sections.entries()]
      .map(([section, count]) => ({ count, section }))
      .sort((a, b) => b.count - a.count || a.section.localeCompare(b.section, "de")),
    skippedLargeFiles,
    status: "online",
    writesEnabled: false,
  };
}
