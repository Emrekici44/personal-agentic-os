import { NextResponse } from 'next/server';
import { previewVaultNormalization } from '@/lib/obsidian-vault';
export async function GET(){try{return NextResponse.json(await previewVaultNormalization(),{headers:{'Cache-Control':'no-store, private'}})}catch{return NextResponse.json({status:'degraded',error:'Vault-Normalisierungsvorschau lokal nicht verfügbar',writesPerformed:false},{status:503,headers:{'Cache-Control':'no-store, private'}})}}
