export type ModelCapability = "structured_output" | "reasoning" | "tool_planning";
export interface ModelPolicy { reasoning: "low" | "medium" | "high"; latency: "fast" | "flexible"; structuredOutput: true; privacy: "private" | "test_fixture"; toolPlanning: boolean; costClass: "zero" | "bounded"; }
export interface ModelRequest { id: string; purpose: "planner"; policy: ModelPolicy; input: Record<string, unknown>; schemaId: string; maxOutputUnits?: number; runId?: string; }
export interface ModelUsage { estimatedInputUnits: number | null; estimatedOutputUnits: number | null; }
export interface ModelCostEvidence { currency: "EUR"; estimatedCost: number | null; dailyUsage: number | null; monthlyUsage: number | null; dailyLimit: number | null; monthlyLimit: number | null; }
export interface ModelResponse { providerId: string; modelId: string | null; output: Record<string, unknown>; usage: ModelUsage; cost: ModelCostEvidence; testOnly: boolean; }
export interface ModelProvider { id: string; status: "disabled" | "test_only" | "configured"; capabilities: readonly ModelCapability[]; execute(request: ModelRequest): Promise<ModelResponse>; }
export type ModelFailureCode="provider_disabled"|"budget_exceeded"|"provider_timeout"|"provider_rate_limited"|"provider_invalid_output"|"provider_upstream_failure"|"policy_blocked";
export class ModelFailure extends Error{readonly code:ModelFailureCode;constructor(code:ModelFailureCode,message:string){super(message);this.name="ModelFailure";this.code=code}}
