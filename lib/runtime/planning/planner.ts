import { buildAgentWorkflowProposal } from "../../agent-workflows.ts";
import type { AgentDefinition, PlannerResult, RuntimeContextSnapshot } from "../types.ts";
import crypto from "node:crypto";import {buildModelContextEnvelope} from "../models/context-envelope.ts";import {productionModelRouter} from "../models/router.ts";import {parseStructuredPlannerOutput} from "../models/structured-output.ts";
import type {ModelRequest,ModelResponse} from "../models/types.ts";
import {appendRuntimeAudit} from "../../repositories/audit-repository.ts";

export interface Planner { id: "deterministic-local" | "model-assisted"; plan(input: { agent: AgentDefinition; userInput: string; context: RuntimeContextSnapshot; projectId?: string; requestedSkillId?: string; plannerInput?: Record<string, unknown> }): Promise<PlannerResult>; }

export const deterministicLocalPlanner: Planner = {
  id: "deterministic-local",
  async plan({ agent, userInput, context, projectId, requestedSkillId, plannerInput = {} }) {
    const records = context.records;
    if (agent.defaultSkillId === "weekly_plan") {
      const selectedCalendarIds = Array.isArray(plannerInput.selectedCalendarIds) ? plannerInput.selectedCalendarIds.map(String).slice(0, 12) : [];
      if (!selectedCalendarIds.length) throw new Error("Mindestens ein Kalender ist erforderlich");
      return { summary: "Wochenvorschlag wird deterministisch aus den verifizierten Quellen berechnet.", proposedSteps: [], requiresApproval: false, modelUsed: false, externalActionsPerformed: false, evidence: context.sources, skillInvocations: [{ skillId: "weekly_plan", input: { selectedCalendarIds, generatedAt: String(plannerInput.generatedAt || new Date().toISOString()) }, requestedBy: "agent_default" }], toolIntents: [], memorySuggestions: [], approvalRequirements: [] };
    }
    const result = buildAgentWorkflowProposal(agent.id as Parameters<typeof buildAgentWorkflowProposal>[0], userInput, {
      projects: records.projects || [], tasks: records.tasks || [], inbox: records.inbox || [], habits: records.habits || [],
      journal: records.journal_metadata || [], areas: records.area_records || [], weeklyPlan: records.weekly_plans?.[0] || null,
    }, projectId);
    const skillId = requestedSkillId || agent.defaultSkillId;
    const selectedProjectId = projectId || String((records.projects?.[0] as { id?: string } | undefined)?.id || "");
    const skillInput = skillId === "project_snapshot" ? { projectId: selectedProjectId, limit: 5 } : skillId === "priority_review" ? { focus: userInput, limit: 3 } : skillId === "daily_check" ? { date: new Date().toISOString().slice(0, 10), limit: 5 } : { area: agent.area, limit: 5 };
    return { summary: result.summary, proposedSteps: result.suggestions.map((step) => ({ id: step.id, title: step.title, rationale: step.rationale, type: "proposal" as const, externalAction: false as const, requiresSeparateApproval: true as const })), requiresApproval: true, modelUsed: false, externalActionsPerformed: false, evidence: context.sources, skillInvocations: [{ skillId, input: skillInput, requestedBy: requestedSkillId ? "user_explicit" : "agent_default" }], toolIntents: [], memorySuggestions: [], approvalRequirements: [] };
  },
};

export type ModelRouterLike={execute(request:ModelRequest):Promise<ModelResponse>};
export function createModelAssistedPlanner(router:ModelRouterLike=productionModelRouter):Planner{return{id:"model-assisted",async plan({agent,userInput,context}){const requestId=crypto.randomUUID();appendRuntimeAudit("model.request.started","runtime_context",context.id,{agentId:agent.id,schemaVersion:1});try{const response=await router.execute({id:requestId,purpose:"planner",policy:{reasoning:"high",latency:"flexible",structuredOutput:true,privacy:"private",toolPlanning:true,costClass:"bounded"},input:buildModelContextEnvelope(agent,userInput,context),schemaId:"agentic_os_planner_v1",maxOutputUnits:1200});const parsed=parseStructuredPlannerOutput(agent,response.output,context.sources);appendRuntimeAudit("model.request.completed","runtime_context",context.id,{agentId:agent.id,provider:response.providerId,model:response.modelId||"unknown",schemaVersion:1});return{...parsed,providerEvidence:{provider:response.providerId,model:response.modelId,usage:{inputUnits:response.usage.estimatedInputUnits,outputUnits:response.usage.estimatedOutputUnits},estimatedCost:response.cost.estimatedCost,schemaVersion:1}}}catch(error){appendRuntimeAudit("model.request.blocked","runtime_context",context.id,{agentId:agent.id,category:(error as any)?.code||"provider_failure"});throw error}}}}
export const modelAssistedPlanner=createModelAssistedPlanner();

export function getPlanner(id:AgentDefinition["plannerPolicy"]["plannerId"],router?:ModelRouterLike){return id==="deterministic-local"?deterministicLocalPlanner:createModelAssistedPlanner(router)}
