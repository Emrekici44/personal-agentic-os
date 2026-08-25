export type RuntimeSource = "projects" | "tasks" | "inbox" | "habits" | "journal_metadata" | "area_records" | "weekly_plans" | "calendar_catalog" | "calendar_events";
export type RiskClass = "read" | "local_mutation" | "external_mutation" | "external_read" | "external_create" | "external_update" | "external_delete";
export type RuntimeStatus = "created" | "context_ready" | "planned" | "executing" | "waiting_for_approval" | "waiting_for_review" | "completed" | "partially_completed" | "blocked" | "failed" | "unknown" | "rejected";
export type RunStepType = "context" | "planner" | "skill" | "tool" | "policy" | "approval" | "result";
export type ExecutionStatus = "not_started" | "blocked" | "started" | "confirmed" | "failed" | "unknown";
export type RetryPolicy = "safe" | "new_approval_required" | "manual_verification_required" | "not_retryable";

export interface ExecutionReceipt {
  id: string;
  runId?: string;
  invocationId: string;
  actionType: string;
  targetType: "skill" | "tool" | "calendar" | "google_task" | "vault" | "local_mutation";
  targetId?: string;
  status: ExecutionStatus;
  external: boolean;
  startedAt?: string;
  finishedAt?: string;
  retryPolicy: RetryPolicy;
  evidence: Record<string, string | number | boolean>;
  version: number;
}

export interface PermissionPolicy {
  allowedRiskClasses: readonly RiskClass[];
  requiresApprovalFor: readonly RiskClass[];
}

export interface PlannerPolicy {
  plannerId: "deterministic-local" | "model-assisted";
  fallback?: "none" | "deterministic-local";
  policyVersion?: number;
}

export interface MemoryPolicy {
  readScopes: ReadonlyArray<"global" | "agent" | "project" | "area">;
  candidateKinds: ReadonlyArray<"preference" | "fact" | "observation" | "summary">;
  automaticActivation: false;
}

export type ContextPriority = "P0" | "P1" | "P2";
export interface ContextPolicy {
  maxRecordsPerSource: number;
  sourcePriorities: Partial<Record<RuntimeSource, ContextPriority>>;
  includeMemoryKinds: readonly RuntimeMemory["kind"][];
  includeScopes: readonly RuntimeMemory["scope"][];
  maxMemories: number;
  requireProjectScope?: boolean;
  maxAgeDays?: number;
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
  allowedConnectors?: string[];
  allowedExternalReadTools?: string[];
  allowedExternalCreateTools?: string[];
  allowedExternalUpdateTools?: string[];
  allowedExternalDeleteTools?: string[];
  defaultSkillId: string;
  plannerPolicy: PlannerPolicy;
  memoryPolicy: MemoryPolicy;
  permissionPolicy: PermissionPolicy;
  contextPolicy: ContextPolicy;
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
  version: number;
  source?: RuntimeSource;
  capability: "read" | "local_write" | "external_write";
  riskClass: RiskClass;
  requiresApproval: boolean;
  approvalClass?: string;
  inputSchema: Record<string, unknown>;
}

export interface SafeSourceEvidence {
  source: RuntimeSource;
  recordCount: number;
  verified: boolean;
  includedCount?: number;
  excludedCount?: number;
  priority?: ContextPriority;
  reason?: string;
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
  supersedesId?: string;
  retention?: "standard" | "until_expiry" | "manual_review";
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
  versions: { agentDefinition: number; contextPolicy: number; memories: Array<{ id: string; version: number }> };
}

export interface PlannerResult {
  summary: string;
  proposedSteps: Array<{ id: string; title: string; rationale: string; type: "proposal"; externalAction: false; requiresSeparateApproval: true }>;
  requiresApproval: boolean;
  modelUsed: boolean;
  externalActionsPerformed: false;
  evidence: SafeSourceEvidence[];
  skillInvocations: PlannedSkillInvocation[];
  toolIntents: Array<{ toolId: string; input: Record<string, unknown>; requestedBySkillId?: string }>;
  memorySuggestions: Array<{ kind: RuntimeMemory["kind"]; scope: RuntimeMemory["scope"]; reason: string }>;
  approvalRequirements: Array<{ approvalClass: string; riskClass: RiskClass; reason: string }>;
  providerEvidence?: { provider: string; model: string | null; usage: { inputUnits: number | null; outputUnits: number | null }; estimatedCost: number | null; schemaVersion: number };
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
  data?: unknown;
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
