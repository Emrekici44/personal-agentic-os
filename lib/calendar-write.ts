import crypto from 'node:crypto';
import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { assertBoundedWindow } from './calendar-core.mjs';
import { open, seal } from './google-calendar';
import { consumeApprovalArtifact, createApprovalArtifact } from './repositories/approval-repository';

export type CalendarChange = {
  action: 'create' | 'update' | 'delete';
  calendarId: string;
  eventId?: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  idempotencyKey: string;
  expectedEtag?: string;
};

export function validateCalendarChange(change: CalendarChange) {
  if (!change || !['create', 'update','delete'].includes(change.action)) throw new Error('Nur Erstellen, Aktualisieren oder Löschen ist erlaubt');
  if (!change.calendarId || !change.title || !change.start || !change.end) throw new Error('Kalender, Titel, Start und Ende sind erforderlich');
  if (change.action !== 'create' && (!change.eventId||!change.expectedEtag)) throw new Error('Event-ID und Remote-Version fehlen');
  if (!/^[a-zA-Z0-9._:-]{12,160}$/.test(change.idempotencyKey || '')) throw new Error('Ungültiger Duplikatschutz');
  assertBoundedWindow(change.start, change.end);
  return change;
}

export function createApproval(change: CalendarChange, selectedCalendarIds: string[]) {
  const exact = validateCalendarChange(change);
  if (!selectedCalendarIds.includes(exact.calendarId)) throw new Error('Zielkalender ist nicht ausdrücklich ausgewählt');
  const expiresAt = Date.now() + 15 * 60_000;
  const approvalId = crypto.randomUUID();
  const expiresAtIso = new Date(expiresAt).toISOString();
  createApprovalArtifact({ id: approvalId, actionType: `calendar_event_${exact.action}`, approvalClass: `google_calendar_${exact.action}`, exactPayload: exact, expiresAt: expiresAtIso });
  return { approvalToken: seal(JSON.stringify({ approvalId, change: exact, expiresAt, nonce: crypto.randomUUID() })), expiresAt: expiresAtIso };
}

export function consumeApproval(token: string, confirmation: string): CalendarChange & { approvalId: string } {
  const payload = JSON.parse(open(token));
  const required=payload?.change?.action==='delete'?'DIESEN_TERMIN_JETZT_LOESCHEN':'DIESEN_TERMIN_JETZT_SCHREIBEN';if (confirmation !== required) throw new Error('Exakte Einzelbestätigung fehlt');
  if (!payload.expiresAt || payload.expiresAt < Date.now()) throw new Error('Vorschlag ist abgelaufen');
  const exact = validateCalendarChange(payload.change);
  consumeApprovalArtifact({ id: String(payload.approvalId || ''), actionType: `calendar_event_${exact.action}`, approvalClass: `google_calendar_${exact.action}`, exactPayload: exact });
  return { ...exact, approvalId: String(payload.approvalId) };
}

export async function auditCalendarWrite(entry: Record<string, unknown>) {
  const dir = path.join(process.cwd(), 'local-state');
  await mkdir(dir, { recursive: true });
  await appendFile(path.join(dir, 'calendar-audit.jsonl'), `${JSON.stringify({ at: new Date().toISOString(), ...entry })}\n`, 'utf8');
}
