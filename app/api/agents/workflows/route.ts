import { NextRequest, NextResponse } from "next/server";
import { agentWorkflowProfiles, buildAgentWorkflowProposal, isAgentWorkflowId } from "@/lib/agent-workflows";
import { publicApiError } from "@/lib/public-api-error";
import { latestWeeklyPlan, listAgentWorkflowRuns, listRecords, saveAgentWorkflowRun, transitionAgentWorkflowRun, verifyLocalSession, withStoreTransaction } from "@/lib/shared-store";

const authorized = (request: NextRequest) => verifyLocalSession(request.cookies.get("agentic_os_local_session")?.value);
const headers = { "Cache-Control": "no-store, private" };
const respond = (body: unknown, init: ResponseInit = {}) => NextResponse.json(body, { ...init, headers });

export async function GET(request: NextRequest) {
  if (!authorized(request)) return respond({ error: "Lokale Sitzung erforderlich" }, { status: 401 });
  try {
    return respond({ profiles: agentWorkflowProfiles, runs: listAgentWorkflowRuns(), inventoryVerified: true, provider: "local-rules", model: "none", paidApiEnabled: false, externalActionsEnabled: false });
  } catch {
    return respond({ error: "Agentenläufe sind vorübergehend nicht erreichbar", profiles: [], runs: [], inventoryVerified: false, retrySafe: true, provider: "local-rules", model: "none", paidApiEnabled: false, externalActionsEnabled: false }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return respond({ error: "Lokale Sitzung erforderlich", externalActionsPerformed: false }, { status: 401 });
  try {
    const body = await request.json();
    if (!isAgentWorkflowId(body.workflowId)) throw new Error("Unbekannter Agenten-Workflow");
    const sources = { projects: listRecords("projects"), tasks: listRecords("tasks"), inbox: listRecords("inbox_items"), habits: listRecords("habits"), journal: listRecords("journal_metadata"), areas: listRecords("area_records"), weeklyPlan: latestWeeklyPlan() };
    const proposal = buildAgentWorkflowProposal(body.workflowId, String(body.input || ""), sources, body.projectId ? String(body.projectId) : undefined);
    return respond({ run: withStoreTransaction(() => saveAgentWorkflowRun(proposal)), proposalOnly: true, paidApiUsed: false, externalActionsPerformed: false }, { status: 201 });
  } catch (error) {
    const fallback = "Workflow-Vorschlag konnte lokal nicht sicher erzeugt werden", message = publicApiError(error, fallback), retrySafe = message === fallback;
    return respond({ error: message, retrySafe, externalActionsPerformed: false }, { status: retrySafe ? 503 : 400 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!authorized(request)) return respond({ error: "Lokale Sitzung erforderlich", externalActionsPerformed: false }, { status: 401 });
  try {
    const body = await request.json();
    return respond({ run: withStoreTransaction(() => transitionAgentWorkflowRun(String(body.runId || ""), body.action, body)), externalActionsPerformed: false, nextExternalAction: "not_available" });
  } catch (error) {
    const fallback = "Workflow-Status konnte lokal nicht sicher gespeichert werden", message = publicApiError(error, fallback), retrySafe = message === fallback;
    return respond({ error: message, retrySafe, externalActionsPerformed: false }, { status: retrySafe ? 503 : 400 });
  }
}
