import { NextRequest, NextResponse } from 'next/server';
import { readPrivateJson } from '@/lib/private-request';
import { createMigrationPreview, verifyLocalSession } from '@/lib/shared-store';
const headers={'Cache-Control':'no-store, private'};
export async function POST(req:NextRequest){if(!verifyLocalSession(req.cookies.get('agentic_os_local_session')?.value))return NextResponse.json({error:'Lokale Sitzung erforderlich'},{status:401,headers});try{const body=await readPrivateJson(req);return NextResponse.json(createMigrationPreview(String(body.deviceId||'unknown'),Array.isArray(body.keys)?body.keys:[]),{headers})}catch{return NextResponse.json({error:'Ungültige Migrationsvorschau-Anfrage',migrationPerformed:false},{status:400,headers})}}
