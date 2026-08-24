import { NextRequest, NextResponse } from 'next/server';
import { providerPolicy } from '@/lib/openai-provider.mjs';
import { verifyLocalSession } from '@/lib/shared-store';

export async function GET(request: NextRequest) {
  if (!verifyLocalSession(request.cookies.get('agentic_os_local_session')?.value)) {
    return NextResponse.json(
      { error: 'Lokale Sitzung erforderlich', keyExposed: false },
      { status: 401, headers: { 'Cache-Control': 'no-store, private' } },
    );
  }
  const policy = providerPolicy(process.env);
  return NextResponse.json(
    {
      mode: policy.mode,
      configured: policy.configured,
      killSwitch: policy.killSwitch,
      dailyLimit: policy.dailyLimit,
      monthlyLimit: policy.monthlyLimit,
      keyExposed: false,
      usageSource: 'unavailable',
      modelsVerified: false,
    },
    { headers: { 'Cache-Control': 'no-store, private' } },
  );
}
