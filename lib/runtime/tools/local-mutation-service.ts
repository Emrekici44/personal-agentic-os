import crypto from "node:crypto";
import { createRecord, listRecords, updateRecord, withStoreTransaction } from "../../shared-store.ts";
import { createExecutionReceipt } from "../../repositories/execution-receipt-repository.ts";
import { getToolDefinition } from "./registry.ts";

type Authority = "user_direct_intent" | "agent_proposal" | "scheduled_trigger";
const uuid = (value: unknown) => { const id=String(value||""); if(!/^[0-9a-f-]{36}$/i.test(id))throw new Error("Ungültige ID"); return id; };
const text = (value: unknown,max:number,label:string) => { const result=String(value||"").trim();if(result.length<2||result.length>max)throw new Error(`${label} ist ungültig`);return result; };
const version = (value: unknown) => { const result=Number(value);if(!Number.isInteger(result)||result<1)throw new Error("Version ist ungültig");return result; };

export function executeLocalMutationTool(input: { toolId: string; payload: Record<string, unknown>; authority: Authority }) {
  const definition=getToolDefinition(input.toolId); if(definition.capability!=="local_write"||definition.riskClass!=="local_mutation")throw new Error("Lokales Mutation-Tool ist nicht erlaubt");
  if(input.authority!=="user_direct_intent")throw new Error("Agentische oder geplante Mutation benötigt eine separate Review-Freigabe");
  const invocationId=crypto.randomUUID(), startedAt=new Date().toISOString(), payload=input.payload||{};
  const execution=withStoreTransaction(()=>{let result:any;
    if(input.toolId==="task.create")result=createRecord("tasks",{title:text(payload.title,120,"Aufgabentitel"),projectId:payload.projectId?uuid(payload.projectId):undefined,area:String(payload.area||"Inbox"),priority:String(payload.priority||"medium"),dueAt:payload.dueAt?String(payload.dueAt):undefined,checklist:[],done:false,status:"active"});
    else if(input.toolId==="inbox.create")result=createRecord("inbox_items",{title:text(payload.title,120,"Inbox-Titel"),content:payload.content?text(payload.content,4000,"Inbox-Inhalt"):"",projectId:payload.projectId?uuid(payload.projectId):undefined,itemType:"note",status:"active"});
    else {
    const id=uuid(payload.id), expectedVersion=version(payload.version);
    if(input.toolId==="project.update_next_action"){const current=listRecords("projects").find(item=>item.id===id);if(!current)throw new Error("Projekt nicht gefunden");result=updateRecord("projects",id,{...current,version:expectedVersion,nextAction:text(payload.nextAction,500,"Nächste Aktion")});}
    else {const current=listRecords("tasks").find(item=>item.id===id);if(!current)throw new Error("Aufgabe nicht gefunden");result=updateRecord("tasks",id,{...current,version:expectedVersion,done:input.toolId==="task.complete",status:input.toolId==="task.complete"?"completed":"active"});}}
    const receipt=createExecutionReceipt({invocationId,actionType:input.toolId,targetType:"local_mutation",targetId:String(result.id||""),status:"confirmed",external:false,startedAt,finishedAt:new Date().toISOString(),retryPolicy:"not_retryable",evidence:{authority:input.authority,toolVersion:definition.version,confirmed:true}});
    return {result,receipt};
  });
  return {...execution,externalActionsPerformed:false};
}
