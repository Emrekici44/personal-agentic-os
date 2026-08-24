import { NextRequest, NextResponse } from 'next/server';
import { persistTokenCookie } from '@/lib/google-calendar';

export async function POST(req: NextRequest) {
  try {
    persistTokenCookie(req.cookies.get('agentic_os_google_token')?.value);
    return NextResponse.json({ sharedLocally: true, encryptedAtRest: true, credentialsExposed: false });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Lokale Desktop-Freigabe fehlgeschlagen' }, { status: 400 });
  }
}
