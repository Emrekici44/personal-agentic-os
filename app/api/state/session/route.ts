import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { signLocalSession, trustedPrivateHost } from '@/lib/shared-store';

export async function POST(req:NextRequest){
  if(!trustedPrivateHost(req.headers.get('host')||''))return NextResponse.json({error:'Nur privater Agentic-OS-Zugriff erlaubt'},{status:403});
  const value=`local:${crypto.randomUUID()}`;
  const response=NextResponse.json({authenticated:true,privateOnly:true});
  response.cookies.set('agentic_os_local_session',signLocalSession(value),{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/',maxAge:86400});
  return response;
}
