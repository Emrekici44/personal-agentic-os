import { NextRequest, NextResponse } from 'next/server';
import { persistTokenCookie } from '@/lib/google-calendar';
import { publicApiError } from '@/lib/public-api-error';
import { verifyLocalSession } from '@/lib/shared-store';

const headers = { 'Cache-Control': 'no-store, private' };

export async function POST(req: NextRequest) {
  try {
    if (!verifyLocalSession(req.cookies.get('agentic_os_local_session')?.value)) {
      return NextResponse.json({ error: 'Lokale Sitzung erforderlich', credentialsExposed: false }, { status: 401, headers });
    }
    persistTokenCookie(req.cookies.get('agentic_os_google_token')?.value);
    return NextResponse.json({ sharedLocally: true, encryptedAtRest: true, credentialsExposed: false }, { headers });
  } catch (error) {
    return NextResponse.json({ error: publicApiError(error, 'Lokale Calendar-Übernahme konnte nicht sicher bestätigt werden'), sharedLocally: false, credentialsExposed: false }, { status: 400, headers });
  }
}
