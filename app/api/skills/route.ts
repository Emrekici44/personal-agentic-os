import { NextRequest, NextResponse } from "next/server";
import { executeLocalSkill, skillProcedureCatalog, skillSafetyContract } from "@/lib/local-skills.mjs";
import {
  archiveSkillDefinition,
  createSkillDefinition,
  latestWeeklyPlan,
  listRecords,
  listSkillDefinitions,
  listSkillRuns,
  reviewSkillRun,
  saveSkillRun,
  updateSkillDefinition,
  verifyLocalSession,
} from "@/lib/shared-store";

const responseHeaders = { "Cache-Control": "no-store, private" };
const authorized = (request: NextRequest) => verifyLocalSession(request.cookies.get("agentic_os_local_session")?.value);
const reject = (error: unknown, status = 400) => NextResponse.json({ error: error instanceof Error ? error.message : "Skill-Anfrage fehlgeschlagen", writesPerformed: false }, { status, headers: responseHeaders });

function loadAllowedSources(allowedSources: string[]) {
  const snapshot: Record<string, unknown[]> = {};
  for (const source of allowedSources) {
    if (source === "tasks") snapshot[source] = listRecords("tasks");
    else if (source === "projects") snapshot[source] = listRecords("projects");
    else if (source === "inbox_items") snapshot[source] = listRecords("inbox_items");
    else if (source === "habits") snapshot[source] = listRecords("habits");
    else if (source === "journal_metadata") snapshot[source] = listRecords("journal_metadata");
    else if (source === "area_records") snapshot[source] = listRecords("area_records");
    else if (source === "weekly_plans") {
      const latest = latestWeeklyPlan();
      snapshot[source] = latest ? [latest] : [];
    } else throw new Error("Nicht erlaubte Skill-Quelle");
  }
  return snapshot;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return reject(new Error("Lokale Sitzung erforderlich"), 401);
  const definitions = listSkillDefinitions();
  return NextResponse.json({
    definitions,
    runs: listSkillRuns(),
    catalog: skillProcedureCatalog,
    safety: skillSafetyContract,
    legacyMetadataCount: definitions.filter((skill) => !skill.executable && skill.status === "metadata_only").length,
    executionMode: "deterministic-local",
    paidApiEnabled: false,
    externalActionsEnabled: false,
  }, { headers: responseHeaders });
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return reject(new Error("Lokale Sitzung erforderlich"), 401);
  try {
    const body = await request.json();
    if (body.action === "create_definition") {
      return NextResponse.json({ definition: createSkillDefinition(body.definition), writesPerformed: true, externalActionsPerformed: false }, { status: 201, headers: responseHeaders });
    }
    if (body.action === "run_preview") {
      const skill = listSkillDefinitions().find((entry) => entry.id === String(body.skillId || ""));
      if (!skill) throw new Error("Skill nicht gefunden");
      const preview = executeLocalSkill(skill, body.input, loadAllowedSources(skill.allowedSources));
      return NextResponse.json({ run: saveSkillRun(skill, preview), previewOnly: true, externalActionsPerformed: false }, { status: 201, headers: responseHeaders });
    }
    throw new Error("Unbekannte Skill-Aktion");
  } catch (error) {
    return reject(error);
  }
}

export async function PATCH(request: NextRequest) {
  if (!authorized(request)) return reject(new Error("Lokale Sitzung erforderlich"), 401);
  try {
    const body = await request.json();
    if (body.action === "update_definition") return NextResponse.json({ definition: updateSkillDefinition(String(body.skillId || ""), body.definition), externalActionsPerformed: false }, { headers: responseHeaders });
    if (body.action === "archive_definition") return NextResponse.json({ result: archiveSkillDefinition(String(body.skillId || "")), externalActionsPerformed: false }, { headers: responseHeaders });
    if (body.action === "review_run") return NextResponse.json({ run: reviewSkillRun(String(body.runId || "")), externalActionsPerformed: false }, { headers: responseHeaders });
    throw new Error("Unbekannte Skill-Aktion");
  } catch (error) {
    return reject(error);
  }
}
