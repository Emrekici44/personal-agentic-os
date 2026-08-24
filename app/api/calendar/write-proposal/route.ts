import { NextRequest, NextResponse } from 'next/server';
import { createApproval, validateCalendarChange } from '@/lib/calendar-write';
import { verifyLocalSession } from '@/lib/shared-store';
const headers={'Cache-Control':'no-store, private'};

export async function POST(req: NextRequest) {
  try {
    if (!verifyLocalSession(req.cookies.get('agentic_os_local_session')?.value)) return NextResponse.json({ error: 'Lokale Sitzung erforderlich', writesPerformed: false }, { status: 401, headers });
    const body = await req.json();
    const change = validateCalendarChange(body.change);
    const approval = createApproval(change, body.selectedCalendarIds || []);
    return NextResponse.json({ proposalOnly: true, writesPerformed: false, deletesEnabled: false, exactChange: change, ...approval, expiresInSeconds: 900 },{headers});
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Ungültiger Kalendervorschlag' }, { status: 400, headers });
  }
}
