export type RuntimeSource = "projects" | "tasks" | "inbox" | "habits" | "journal_metadata" | "area_records" | "weekly_plans";
export type RiskClass = "read" | "local_mutation" | "external_mutation";
export type RuntimeStatus = "created" | "context_built" | "planning" | "proposal_ready" | "waiting_for_review" | "approved" | "rejected" | "completed" | "failed";
export type RunStepType = "context" | "planner" | "skill" | "tool" | "policy" | "approval" | "result";

export interface PermissionPolicy {
  allowedRiskClasses: readonly RiskClass[];
  requiresApprovalFor: readonly RiskClass[];
}

export interface PlannerPolicy {
  plannerId: "deterministic-local" | "model-assisted";
}

export interface MemoryPolicy {
  readScopes: ReadonlyArray<"global" | "agent" | "project" | "area">;
  candidateKinds: ReadonlyArray<"preference" | "fact" | "observation" | "summary">;
  automaticActivation: false;
}

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  objective: string;
  area: string;
  boundary: string;
  allowedSkills: string[];
  allowedTools: string[];
  allowedSources: RuntimeSource[];
  defaultSkillId: string;
  plannerPolicy: PlannerPolicy;
  memoryPolicy: MemoryPolicy;
  permissionPolicy: PermissionPolicy;
  status: "active" | "paused";
  version: number;
}

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  version: number;
  inputSchema: Record<string, unknown>;
  allowedSources: RuntimeSource[];
  executionMode: "deterministic-local" | "model-assisted";
  permissionPolicy: PermissionPolicy;
  status: "active" | "paused";
}

export interface ToolDefinition {
  id: string;
  name: string;
  source: RuntimeSource;
  capability: "read" | "local_write" | "external_write";
  riskClass: "low" | "medium" | "high";
  requiresApproval: boolean;
  inputSchema: Record<string, unknown>;
}

export interface SafeSourceEvidence {
  source: RuntimeSource;
  recordCount: number;
  verified: boolean;
}

export interface RuntimeMemory {
  id: string;
  kind: "policy" | "preference" | "fact" | "observation" | "summary";
  scope: "global" | "agent" | "project" | "area";
  scopeId?: string;
  content: string;
  sourceType: string;
  sourceId?: string;
  confidence?: number;
  status: "candidate" | "active" | "rejected" | "superseded";
  createdAt: string;
  lastConfirmedAt?: string;
  expiresAt?: string;
  version: number;
}

export interface RuntimeContextSnapshot {
  id: string;
  agentId: string;
  createdAt: string;
  sources: SafeSourceEvidence[];
  records: Partial<Record<RuntimeSource, unknown[]>>;
  memories: RuntimeMemory[];
  projectId?: string;
  scope?: { area?: string };
}

export interface PlannerResult {
  summary: string;
  proposedSteps: Array<{ id: string; title: string; rationale: string; type: "proposal"; externalAction: false; requiresSeparateApproval: true }>;
  requiresApproval: boolean;
  modelUsed: false;
  externalActionsPerformed: false;
  evidence: SafeSourceEvidence[];
  skillInvocations: PlannedSkillInvocation[];
}

export interface PlannedSkillInvocation {
  skillId: string;
  input: Record<string, unknown>;
  requestedBy: "planner" | "agent_default" | "user_explicit";
}

export interface SkillInvocation extends PlannedSkillInvocation {
  id: string;
  createdAt: string;
}

export interface ToolInvocation {
  id: string;
  toolId: string;
  capability: "read";
  input: Record<string, unknown>;
  requestedBySkillId?: string;
  createdAt: string;
}

export interface ToolExecutionResult {
  invocationId: string;
  toolId: string;
  status: "completed" | "blocked" | "failed";
  recordCount: number;
  evidence: { verified: boolean; source: RuntimeSource; filtersApplied: number };
  externalActionsPerformed: false;
  modelUsed: false;
  networkCalls: false;
  fileWrites: false;
}

export interface SkillExecutionResult {
  invocationId: string;
  skillId: string;
  status: "completed" | "blocked" | "failed";
  summary: string;
  items: Array<{ id: string; source: string; sourceId: string; title: string; rationale: string; type: "proposal"; externalAction: false }>;
  toolInvocations: ToolInvocation[];
  toolResults: ToolExecutionResult[];
  deterministicSteps: string[];
  sourceEvidence: Record<string, number>;
  input: Record<string, unknown>;
  externalActionsPerformed: false;
  modelUsed: false;
  networkCalls: false;
  fileWrites: false;
  backgroundActions: false;
}

export interface RunStep {
  id: string;
  runId: string;
  index: number;
  type: RunStepType;
  status: "pending" | "running" | "completed" | "failed" | "blocked";
  startedAt?: string;
  completedAt?: string;
  evidence?: Record<string, string | number | boolean>;
}
