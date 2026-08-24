import { NextRequest, NextResponse } from 'next/server';
import { createMigrationPreview, verifyLocalSession } from '@/lib/shared-store';
const headers={'Cache-Control':'no-store, private'};
export async function POST(req:NextRequest){if(!verifyLocalSession(req.cookies.get('agentic_os_local_session')?.value))return NextResponse.json({error:'Lokale Sitzung erforderlich'},{status:401,headers});const body=await req.json();return NextResponse.json(createMigrationPreview(String(body.deviceId||'unknown'),Array.isArray(body.keys)?body.keys:[]),{headers})}
