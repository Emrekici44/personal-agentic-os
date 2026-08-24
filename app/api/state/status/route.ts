import { NextRequest, NextResponse } from 'next/server';
import { storeStatus, verifyLocalSession } from '@/lib/shared-store';
export async function GET(req:NextRequest){if(!verifyLocalSession(req.cookies.get('agentic_os_local_session')?.value))return NextResponse.json({error:'Lokale Sitzung erforderlich'},{status:401});return NextResponse.json(storeStatus())}
