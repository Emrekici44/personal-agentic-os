import crypto from "node:crypto";
import { operationalDatabase } from "../store/database.ts";
import { decryptSensitive, encryptSensitive } from "../store/encryption.ts";

const approvalClasses = new Set(["external_calendar_write", "local_mutation", "vault_write", "future_message_send"]);
const normalize = (value: unknown): unknown => Array.isArray(value) ? value.map(normalize) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, normalize(item)])) : value;
const canonical = (value: unknown) => JSON.stringify(normalize(value));
const digest = (value: unknown) => crypto.createHash("sha256").update(canonical(value)).digest();

export function createApprovalArtifact(input: { id?: string; actionType: string; approvalClass: string; exactPayload: unknown; expiresAt: string }) {
  if (!approvalClasses.has(input.approvalClass) || !/^[a-z][a-z0-9_.-]{2,79}$/.test(input.actionType) || Date.parse(input.expiresAt) <= Date.now()) throw new Error("Ungültige Freigabe");
  const id = input.id || crypto.randomUUID(), now = new Date().toISOString();
  operationalDatabase().prepare("INSERT INTO approvals(id,action_type,status,exact_diff_json,expires_at,version,updated_at) VALUES(?,?,?,?,?,1,?)").run(id, input.actionType, "review_required", encryptSensitive({ approvalClass: input.approvalClass, exactPayload: input.exactPayload }), input.expiresAt, now);
  operationalDatabase().prepare("INSERT INTO audit_log(id,action,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?)").run(crypto.randomUUID(), "approval.create", "approval", id, JSON.stringify({ actionType: input.actionType, approvalClass: input.approvalClass, status: "review_required" }), now);
  return { id, actionType: input.actionType, approvalClass: input.approvalClass, status: "review_required" as const, exactPayloadHash: digest(input.exactPayload).toString("hex"), expiresAt: input.expiresAt, createdAt: now, version: 1 };
}

export function consumeApprovalArtifact(input: { id: string; actionType: string; approvalClass: string; exactPayload: unknown }) {
  const row = operationalDatabase().prepare("SELECT * FROM approvals WHERE id=?").get(input.id) as Record<string, unknown> | undefined;
  if (!row || row.action_type !== input.actionType) throw new Error("Freigabe nicht gefunden");
  if (row.status !== "review_required") throw new Error("Freigabe wurde bereits verwendet");
  if (Date.now() > Date.parse(String(row.expires_at))) throw new Error("Vorschlag ist abgelaufen");
  const stored = decryptSensitive(String(row.exact_diff_json)) as { approvalClass?: string; exactPayload?: unknown };
  if (stored.approvalClass !== input.approvalClass) throw new Error("Freigabeklasse stimmt nicht überein");
  const expected = digest(stored.exactPayload), actual = digest(input.exactPayload);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) throw new Error("Exakte Freigabe stimmt nicht mehr überein");
  const now = new Date().toISOString(), result = operationalDatabase().prepare("UPDATE approvals SET status='consumed',decided_at=?,version=version+1,updated_at=? WHERE id=? AND status='review_required' AND version=?").run(now, now, input.id, Number(row.version));
  if (!result.changes) throw new Error("Freigabe wurde bereits verwendet");
  operationalDatabase().prepare("INSERT INTO audit_log(id,action,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?)").run(crypto.randomUUID(), "approval.consume", "approval", input.id, JSON.stringify({ actionType: input.actionType, approvalClass: input.approvalClass, status: "consumed" }), now);
  return { id: input.id, status: "consumed" as const, consumedAt: now, version: Number(row.version) + 1 };
}
