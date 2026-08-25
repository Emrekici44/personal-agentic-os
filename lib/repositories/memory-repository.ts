import crypto from "node:crypto";
import { operationalDatabase } from "../store/database.ts";
import { decryptSensitive, encryptSensitive } from "../store/encryption.ts";
import { appendRuntimeAudit } from "./audit-repository.ts";
import type { AgentDefinition, RuntimeMemory } from "../runtime/types.ts";

type MemoryInput = Pick<RuntimeMemory, "kind" | "scope" | "content" | "sourceType"> & Partial<Pick<RuntimeMemory, "scopeId" | "sourceId" | "confidence" | "expiresAt">>;
const kinds = new Set(["policy", "preference", "fact", "observation", "summary"]), scopes = new Set(["global", "agent", "project", "area"]);
const bounded = (value: unknown, max: number, label: string) => { const text = String(value || "").trim(); if (!text || text.length > max) throw new Error(`${label} ist ungültig`); return text; };

function mapMemory(row: Record<string, unknown>): RuntimeMemory {
  const content = decryptSensitive(String(row.content_enc)) as { content: string };
  const provenance = decryptSensitive(String(row.provenance_enc)) as { sourceType: string; sourceId?: string };
  return { id: String(row.id), kind: row.kind as RuntimeMemory["kind"], scope: row.scope as RuntimeMemory["scope"], scopeId: row.scope_id ? String(row.scope_id) : undefined, content: content.content, sourceType: provenance.sourceType, sourceId: provenance.sourceId, confidence: row.confidence == null ? undefined : Number(row.confidence), status: row.status as RuntimeMemory["status"], createdAt: String(row.created_at), lastConfirmedAt: row.last_confirmed_at ? String(row.last_confirmed_at) : undefined, expiresAt: row.expires_at ? String(row.expires_at) : undefined, version: Number(row.version) };
}

export function createMemoryCandidate(input: MemoryInput, actorType: "agent" | "user" = "agent") {
  if (!kinds.has(input.kind) || !scopes.has(input.scope)) throw new Error("Ungültiger Memory-Typ oder Scope");
  if (input.scope !== "global" && !input.scopeId) throw new Error("Memory-Scope benötigt eine ID");
  if (actorType === "agent" && input.kind === "policy") throw new Error("Agenten dürfen keine Policy Memory erzeugen");
  const content = bounded(input.content, 4000, "Memory-Inhalt"), sourceType = bounded(input.sourceType, 80, "Memory-Provenance");
  const confidence = input.confidence == null ? null : Number(input.confidence); if (confidence != null && (!Number.isFinite(confidence) || confidence < 0 || confidence > 1)) throw new Error("Memory-Konfidenz ist ungültig");
  const id = crypto.randomUUID(), now = new Date().toISOString();
  operationalDatabase().prepare("INSERT INTO memory_items(id,kind,scope,scope_id,status,content_enc,provenance_enc,confidence,expires_at,version,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,1,?,?)").run(id, input.kind, input.scope, input.scopeId || null, "candidate", encryptSensitive({ content }), encryptSensitive({ sourceType, sourceId: input.sourceId }), confidence, input.expiresAt || null, now, now);
  operationalDatabase().prepare("INSERT INTO memory_events(id,memory_id,event_type,actor_type,metadata_json,created_at) VALUES(?,?,?,?,?,?)").run(crypto.randomUUID(), id, "candidate_created", actorType, JSON.stringify({ kind: input.kind, scope: input.scope }), now);
  appendRuntimeAudit("memory.candidate.created", "memory", id, { kind: input.kind, scope: input.scope });
  return getMemory(id)!;
}

export function getMemory(id: string) { const row = operationalDatabase().prepare("SELECT * FROM memory_items WHERE id=?").get(id) as Record<string, unknown> | undefined; return row ? mapMemory(row) : null; }

export function reviewMemory(id: string, decision: "activate" | "reject", expectedVersion: number, actorType: "user" | "agent" = "user") {
  const current = getMemory(id); if (!current) throw new Error("Memory Candidate nicht gefunden");
  if (current.status !== "candidate" || current.version !== expectedVersion) throw new Error("Datenkonflikt: Memory wurde bereits geändert");
  if (actorType !== "user") throw new Error("Memory-Aktivierung benötigt eine Nutzerentscheidung");
  const status = decision === "activate" ? "active" : "rejected", now = new Date().toISOString();
  const result = operationalDatabase().prepare("UPDATE memory_items SET status=?,last_confirmed_at=?,version=version+1,updated_at=? WHERE id=? AND version=? AND status='candidate'").run(status, decision === "activate" ? now : null, now, id, expectedVersion);
  if (!result.changes) throw new Error("Datenkonflikt: Memory wurde bereits geändert");
  operationalDatabase().prepare("INSERT INTO memory_events(id,memory_id,event_type,actor_type,metadata_json,created_at) VALUES(?,?,?,?,?,?)").run(crypto.randomUUID(), id, status, actorType, "{}", now);
  appendRuntimeAudit(status === "active" ? "memory.activated" : "memory.rejected", "memory", id, { kind: current.kind, scope: current.scope });
  return getMemory(id)!;
}

export function supersedeMemory(id: string, expectedVersion: number, actorType: "user" | "agent" = "user") {
  const current = getMemory(id); if (!current) throw new Error("Memory nicht gefunden");
  if (current.status !== "active" || current.version !== expectedVersion) throw new Error("Datenkonflikt: Memory wurde bereits geändert");
  if (actorType !== "user") throw new Error("Memory-Änderung benötigt eine Nutzerentscheidung");
  const now = new Date().toISOString(), result = operationalDatabase().prepare("UPDATE memory_items SET status='superseded',version=version+1,updated_at=? WHERE id=? AND version=? AND status='active'").run(now, id, expectedVersion);
  if (!result.changes) throw new Error("Datenkonflikt: Memory wurde bereits geändert");
  operationalDatabase().prepare("INSERT INTO memory_events(id,memory_id,event_type,actor_type,metadata_json,created_at) VALUES(?,?,?,?,?,?)").run(crypto.randomUUID(), id, "superseded", actorType, "{}", now);
  appendRuntimeAudit("memory.superseded", "memory", id, { kind: current.kind, scope: current.scope });
  return getMemory(id)!;
}

export function retrieveActiveMemories(agent: AgentDefinition, projectId?: string, area?: string) {
  const now = new Date().toISOString(), rows = operationalDatabase().prepare("SELECT * FROM memory_items WHERE status='active' AND (expires_at IS NULL OR expires_at>?) ORDER BY updated_at DESC LIMIT 100").all(now) as Array<Record<string, unknown>>;
  return rows.map(mapMemory).filter((memory) => agent.memoryPolicy.readScopes.includes(memory.scope) && (memory.scope === "global" || (memory.scope === "agent" && memory.scopeId === agent.id) || (memory.scope === "project" && projectId && memory.scopeId === projectId) || (memory.scope === "area" && area === agent.area && memory.scopeId === agent.area)));
}

export function listMemoryCandidates(limit = 30) { const safe = Math.min(50, Math.max(1, Math.trunc(limit) || 30)); return (operationalDatabase().prepare("SELECT * FROM memory_items WHERE status='candidate' ORDER BY updated_at DESC LIMIT ?").all(safe) as Array<Record<string, unknown>>).map(mapMemory); }
