import { NextRequest, NextResponse } from 'next/server';
import { providerPolicy } from '@/lib/openai-provider.mjs';
import { verifyLocalSession } from '@/lib/shared-store';
import {createOpenAIProviderBoundary} from '@/lib/runtime/models/openai-provider';
import {modelUsageTotals} from '@/lib/repositories/model-usage-repository';

export async function GET(request: NextRequest) {
  if (!verifyLocalSession(request.cookies.get('agentic_os_local_session')?.value)) {
    return NextResponse.json(
      { error: 'Lokale Sitzung erforderlich', keyExposed: false },
      { status: 401, headers: { 'Cache-Control': 'no-store, private' } },
    );
  }
  const policy = providerPolicy(process.env);
  const provider=createOpenAIProviderBoundary(),usage=modelUsageTotals('openai');
  return NextResponse.json(
    {
      mode: policy.mode,
      configured: policy.configured,
      killSwitch: policy.killSwitch,
      dailyLimit: policy.dailyLimit,
      monthlyLimit: policy.monthlyLimit,
      providerEnabled:provider.status==='configured',
      maxCostPerRun:Number(process.env.OPENAI_MAX_COST_PER_RUN_EUR||0),
      estimatedCostPerRun:Number(process.env.OPENAI_ESTIMATED_COST_PER_RUN_EUR||0),
      dailyUsage:usage.daily,
      monthlyUsage:usage.monthly,
      keyExposed: false,
      usageSource: 'local-content-light-ledger',
      modelsVerified: provider.status==='configured',
    },
    { headers: { 'Cache-Control': 'no-store, private' } },
  );
}
