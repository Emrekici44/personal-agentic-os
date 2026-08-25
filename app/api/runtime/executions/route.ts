import { NextRequest, NextResponse } from "next/server";
import { listRecentExecutionReceipts } from "@/lib/repositories/execution-receipt-repository";
import { verifyLocalSession } from "@/lib/shared-store";
const headers={"Cache-Control":"no-store, private"},respond=(body:unknown,init:ResponseInit={})=>NextResponse.json(body,{...init,headers});
export async function GET(request:NextRequest){if(!verifyLocalSession(request.cookies.get("agentic_os_local_session")?.value))return respond({error:"Lokale Sitzung erforderlich"},{status:401});try{return respond({receipts:listRecentExecutionReceipts(),inventoryVerified:true})}catch{return respond({error:"Execution History ist nicht erreichbar",receipts:[],inventoryVerified:false,retrySafe:true},{status:503})}}
