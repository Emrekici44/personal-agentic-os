import { NextRequest, NextResponse } from 'next/server';
import { createMigrationPreview, verifyLocalSession } from '@/lib/shared-store';
export async function POST(req:NextRequest){if(!verifyLocalSession(req.cookies.get('agentic_os_local_session')?.value))return NextResponse.json({error:'Lokale Sitzung erforderlich'},{status:401});const body=await req.json();return NextResponse.json(createMigrationPreview(String(body.deviceId||'unknown'),Array.isArray(body.keys)?body.keys:[]))}
