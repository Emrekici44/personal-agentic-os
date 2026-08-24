import { NextRequest, NextResponse } from 'next/server';
import { storeStatus, verifyLocalSession } from '@/lib/shared-store';
const headers={'Cache-Control':'no-store, private'};
export async function GET(req:NextRequest){if(!verifyLocalSession(req.cookies.get('agentic_os_local_session')?.value))return NextResponse.json({error:'Lokale Sitzung erforderlich'},{status:401,headers});return NextResponse.json(storeStatus(),{headers})}
