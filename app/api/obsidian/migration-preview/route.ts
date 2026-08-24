import { NextRequest, NextResponse } from 'next/server';
import { previewVaultNormalization } from '@/lib/obsidian-vault';
import { verifyLocalSession } from '@/lib/shared-store';

export async function GET(request: NextRequest) {
  if (!verifyLocalSession(request.cookies.get('agentic_os_local_session')?.value)) {
    return NextResponse.json(
      { error: 'Lokale Sitzung erforderlich', writesPerformed: false },
      { status: 401, headers: { 'Cache-Control': 'no-store, private' } },
    );
  }
  try {
    return NextResponse.json(await previewVaultNormalization(), { headers: { 'Cache-Control': 'no-store, private' } });
  } catch {
    return NextResponse.json(
      { status: 'degraded', error: 'Vault-Normalisierungsvorschau lokal nicht verfügbar', writesPerformed: false },
      { status: 503, headers: { 'Cache-Control': 'no-store, private' } },
    );
  }
}
