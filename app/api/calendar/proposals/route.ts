import {NextRequest,NextResponse} from 'next/server';import {verifyLocalSession} from '@/lib/shared-store';
const headers={'Cache-Control':'no-store, private'};
export async function POST(req:NextRequest){if(!verifyLocalSession(req.cookies.get('agentic_os_local_session')?.value))return NextResponse.json({error:'Lokale Sitzung erforderlich',writesPerformed:false},{status:401,headers});return NextResponse.json({error:'Dieser frühere Testadapter ist deaktiviert. Nutze den echten gemeinsamen Wochenplaner.',retired:true,proposalOnly:true,writesPerformed:false},{status:410,headers})}
