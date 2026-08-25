import { NextRequest, NextResponse } from 'next/server';
import { createApproval, validateCalendarChange } from '@/lib/calendar-write';
import { publicApiError } from '@/lib/public-api-error';
import { readPrivateJson, trustedPrivateMutationOrigin } from '@/lib/private-request';
import { verifyLocalSession } from '@/lib/shared-store';
const headers={'Cache-Control':'no-store, private'};

export async function POST(req: NextRequest) {
  try {
    if (!verifyLocalSession(req.cookies.get('agentic_os_local_session')?.value)) return NextResponse.json({ error: 'Lokale Sitzung erforderlich', writesPerformed: false }, { status: 401, headers });
    if (!trustedPrivateMutationOrigin(req)) return NextResponse.json({ error: 'Anfrageherkunft nicht zulässig', proposalOnly: true, writesPerformed: false }, { status: 403, headers });
    const body = await readPrivateJson(req);
    const change = validateCalendarChange(body.change);
    const approval = createApproval(change, body.selectedCalendarIds || []);
    return NextResponse.json({ proposalOnly: true, writesPerformed: false, deletesEnabled: true, destructive:change.action==='delete', exactChange: change, ...approval, expiresInSeconds: 900 },{headers});
  } catch (error) {
    return NextResponse.json({ error: publicApiError(error, 'Kalendervorschlag konnte nicht sicher geprüft werden'), proposalOnly: true, writesPerformed: false }, { status: 400, headers });
  }
}
