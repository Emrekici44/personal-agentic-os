import crypto from "node:crypto";
import { operationalDatabase } from "../store/database.ts";

export function appendRuntimeAudit(action: string, entityType: string, entityId: string | null, metadata: Record<string, string | number | boolean> = {}) {
  if (!/^(agent\.(run\.created|context\.built|plan\.generated|skill\.invoked)|skill\.run\.(completed|blocked)|tool\.(read\.completed|execution\.blocked)|memory\.(candidate\.created|activated|rejected|superseded)|policy\.blocked|runtime\.(run\.(created|failed)|context\.created|plan\.completed|skill\.completed|tool\.completed|policy\.blocked))$/.test(action)) throw new Error("Nicht erlaubtes Runtime-Audit-Ereignis");
  const safe = Object.fromEntries(Object.entries(metadata).filter(([key, value]) => !/content|input|path|secret|token/i.test(key) && ["string", "number", "boolean"].includes(typeof value)));
  operationalDatabase().prepare("INSERT INTO audit_log(id,action,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?)").run(crypto.randomUUID(), action, entityType, entityId, JSON.stringify(safe), new Date().toISOString());
}
