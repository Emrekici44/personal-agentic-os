import { NextRequest, NextResponse } from "next/server";
import { agentWorkflowProfiles, buildAgentWorkflowProposal, isAgentWorkflowId } from "@/lib/agent-workflows";
import { latestWeeklyPlan, listAgentWorkflowRuns, listRecords, saveAgentWorkflowRun, transitionAgentWorkflowRun, verifyLocalSession } from "@/lib/shared-store";

const authorized = (request: NextRequest) => verifyLocalSession(request.cookies.get("agentic_os_local_session")?.value);
const headers = { "Cache-Control": "no-store, private" };

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Lokale Sitzung erforderlich" }, { status: 401 });
  return NextResponse.json({ profiles: agentWorkflowProfiles, runs: listAgentWorkflowRuns(), provider: "local-rules", model: "none", paidApiEnabled: false, externalActionsEnabled: false }, { headers });
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Lokale Sitzung erforderlich", externalActionsPerformed: false }, { status: 401 });
  try {
    const body = await request.json();
    if (!isAgentWorkflowId(body.workflowId)) throw new Error("Unbekannter Agenten-Workflow");
    const sources = { projects: listRecords("projects"), tasks: listRecords("tasks"), inbox: listRecords("inbox_items"), habits: listRecords("habits"), journal: listRecords("journal_metadata"), areas: listRecords("area_records"), weeklyPlan: latestWeeklyPlan() };
    const proposal = buildAgentWorkflowProposal(body.workflowId, String(body.input || ""), sources, body.projectId ? String(body.projectId) : undefined);
    return NextResponse.json({ run: saveAgentWorkflowRun(proposal), proposalOnly: true, paidApiUsed: false, externalActionsPerformed: false }, { status: 201, headers });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Workflow konnte nicht erzeugt werden", externalActionsPerformed: false }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Lokale Sitzung erforderlich", externalActionsPerformed: false }, { status: 401 });
  try {
    const body = await request.json();
    return NextResponse.json({ run: transitionAgentWorkflowRun(String(body.runId || ""), body.action, body), externalActionsPerformed: false, nextExternalAction: "not_available" }, { headers });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Workflow-Status konnte nicht gespeichert werden", externalActionsPerformed: false }, { status: 400 });
  }
}
