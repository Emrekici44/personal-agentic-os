import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { accessToken } from '@/lib/google-calendar';
import { auditCalendarWrite, consumeApproval } from '@/lib/calendar-write';

export async function POST(req: NextRequest) {
  try {
    const access = accessToken(req.cookies.get('agentic_os_google_token')?.value);
    if (!access) throw new Error('Google Calendar ist nicht verbunden');
    const body = await req.json();
    const change = consumeApproval(body.approvalToken, body.confirmation);
    const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(change.calendarId)}/events`;
    if (change.action === 'create') {
      const duplicate = new URL(base);
      duplicate.searchParams.set('privateExtendedProperty', `agenticOsIdempotencyKey=${change.idempotencyKey}`);
      duplicate.searchParams.set('timeMin', new Date(change.start).toISOString());
      duplicate.searchParams.set('timeMax', new Date(change.end).toISOString());
      const existing = await fetch(duplicate, { headers: { authorization: `Bearer ${access}` }, cache: 'no-store' });
      if (!existing.ok) throw new Error('Duplikatprüfung fehlgeschlagen');
      const matches = await existing.json();
      if (matches.items?.length) return NextResponse.json({ written: false, duplicatePrevented: true, auditId: matches.items[0].id });
    }
    const url = change.action === 'update' ? `${base}/${encodeURIComponent(change.eventId!)}` : base;
    const event = { summary: change.title, description: change.description, location: change.location, start: { dateTime: change.start }, end: { dateTime: change.end }, extendedProperties: { private: { agenticOsIdempotencyKey: change.idempotencyKey } } };
    const response = await fetch(url, { method: change.action === 'update' ? 'PATCH' : 'POST', headers: { authorization: `Bearer ${access}`, 'content-type': 'application/json' }, body: JSON.stringify(event), cache: 'no-store' });
    if (!response.ok) throw new Error('Google Calendar Write fehlgeschlagen');
    const result = await response.json();
    const auditId = crypto.randomUUID();
    await auditCalendarWrite({ auditId, action: change.action, calendarId: change.calendarId, eventId: result.id, idempotencyKey: change.idempotencyKey, approved: true });
    return NextResponse.json({ written: true, action: change.action, eventId: result.id, auditId, deletesEnabled: false });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Kalenderänderung abgelehnt' }, { status: 400 });
  }
}

export async function DELETE() {
  return NextResponse.json({ error: 'Kalender-Löschungen sind deaktiviert' }, { status: 405, headers: { Allow: 'POST' } });
}
