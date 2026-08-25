import { NextRequest, NextResponse } from "next/server";
import { agentDefinitions } from "@/lib/runtime/agents/registry";
import { runAgent } from "@/lib/runtime/service";
import { listRuntimeRuns } from "@/lib/repositories/runtime-repository";
import { publicApiError, publicConflict } from "@/lib/public-api-error";
import { readPrivateJson, trustedPrivateMutationOrigin } from "@/lib/private-request";
import { transitionAgentWorkflowRun, verifyLocalSession, withStoreTransaction } from "@/lib/shared-store";
import {ModelFailure} from "@/lib/runtime/models/types";
import {createOpenAIProviderBoundary} from "@/lib/runtime/models/openai-provider";

const authorized = (request: NextRequest) => verifyLocalSession(request.cookies.get("agentic_os_local_session")?.value);
const headers = { "Cache-Control": "no-store, private" };
const respond = (body: unknown, init: ResponseInit = {}) => NextResponse.json(body, { ...init, headers });

export async function GET(request: NextRequest) {
  if (!authorized(request)) return respond({ error: "Lokale Sitzung erforderlich" }, { status: 401 });
  try {
    const profiles = agentDefinitions.map(({ plannerPolicy, memoryPolicy, permissionPolicy, allowedSkills, allowedTools, allowedSources, ...profile }) => ({ ...profile, purpose: profile.objective, sources: allowedSources, plannerPolicy, memoryPolicy, permissionPolicy, allowedSkills, allowedTools }));
    const provider=createOpenAIProviderBoundary();return respond({ profiles, runs: listRuntimeRuns(), inventoryVerified: true, provider:provider.status==="configured"?"openai":"disabled", model:provider.status==="configured"?(process.env.OPENAI_MODEL||"gpt-5.4"):"none", paidApiEnabled:provider.status==="configured", externalActionsEnabled: false, runtime: { persistentSteps: true, structuredContext: true, firstClassMemory: true,modelAssistedPrepared:true } });
  } catch {
    return respond({ error: "Agentenläufe sind vorübergehend nicht erreichbar", profiles: [], runs: [], inventoryVerified: false, retrySafe: true, provider: "local-rules", model: "none", paidApiEnabled: false, externalActionsEnabled: false }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return respond({ error: "Lokale Sitzung erforderlich", externalActionsPerformed: false }, { status: 401 });
  if (!trustedPrivateMutationOrigin(request)) return respond({ error: "Anfrageherkunft nicht zulässig", externalActionsPerformed: false }, { status: 403 });
  try {
    const body = await readPrivateJson(request);
    const result = await runAgent({ agentId: String(body.workflowId || ""), input: String(body.input || ""), projectId: body.projectId ? String(body.projectId) : undefined, requestedSkillId: body.skillId ? String(body.skillId) : undefined, requestedToolId: body.toolId ? String(body.toolId) : undefined, createMemoryCandidate: body.createMemoryCandidate === true,requestedPlannerMode:body.plannerMode==="model-assisted"?"model-assisted":undefined });
    return respond({ ...result, paidApiUsed: result.modelUsed&&result.provider==="openai" }, { status: 201 });
  } catch (error) {
    const fallback = "Workflow-Vorschlag konnte lokal nicht sicher erzeugt werden", message = publicApiError(error, fallback),providerCode=error instanceof ModelFailure?error.code:null,retrySafe = providerCode?false:message === fallback;
    return respond({ error:providerCode==="provider_disabled"?"Model-assisted Planning ist vorbereitet, aber nicht aktiviert":message,providerStatus:providerCode,retrySafe,modelUsed:false,externalActionsPerformed: false }, { status: providerCode?503:retrySafe ? 503 : 400 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!authorized(request)) return respond({ error: "Lokale Sitzung erforderlich", externalActionsPerformed: false }, { status: 401 });
  if (!trustedPrivateMutationOrigin(request)) return respond({ error: "Anfrageherkunft nicht zulässig", externalActionsPerformed: false }, { status: 403 });
  try {
    const body = await readPrivateJson(request);
    return respond({ run: withStoreTransaction(() => transitionAgentWorkflowRun(String(body.runId || ""), body.action, body)), externalActionsPerformed: false, nextExternalAction: "not_available" });
  } catch (error) {
    const fallback = "Workflow-Status konnte lokal nicht sicher gespeichert werden", message = publicApiError(error, fallback), conflict = publicConflict(error), retrySafe = !conflict && message === fallback;
    return respond({ error: message, conflict, retrySafe, externalActionsPerformed: false }, { status: conflict ? 409 : retrySafe ? 503 : 400 });
  }
}
