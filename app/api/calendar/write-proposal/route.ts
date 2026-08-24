import { NextRequest, NextResponse } from 'next/server';
import { createApproval, validateCalendarChange } from '@/lib/calendar-write';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const change = validateCalendarChange(body.change);
    return NextResponse.json({ proposalOnly: true, writesPerformed: false, deletesEnabled: false, exactChange: change, approvalToken: createApproval(change, body.selectedCalendarIds || []), expiresInSeconds: 900 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Ungültiger Kalendervorschlag' }, { status: 400 });
  }
}
