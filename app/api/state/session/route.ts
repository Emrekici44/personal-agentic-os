import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { signLocalSession, trustedPrivateHost } from '@/lib/shared-store';

const headers={'Cache-Control':'no-store, private'};

export async function POST(req:NextRequest){
  if(!trustedPrivateHost(req.headers.get('host')||''))return NextResponse.json({error:'Nur privater Agentic-OS-Zugriff erlaubt'},{status:403,headers});
  const value=`local:${crypto.randomUUID()}`;
  const response=NextResponse.json({authenticated:true,privateOnly:true},{headers});
  response.cookies.set('agentic_os_local_session',signLocalSession(value),{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/',maxAge:86400});
  response.headers.set('Cache-Control','no-store, private');
  return response;
}
