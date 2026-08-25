export type ModelCapability = "structured_output" | "reasoning" | "tool_planning";
export interface ModelPolicy { reasoning: "low" | "medium" | "high"; latency: "fast" | "flexible"; structuredOutput: true; privacy: "private" | "test_fixture"; toolPlanning: boolean; costClass: "zero" | "bounded"; }
export interface ModelRequest { id: string; purpose: "planner"; policy: ModelPolicy; input: Record<string, unknown>; schemaId: string; }
export interface ModelUsage { estimatedInputUnits: number | null; estimatedOutputUnits: number | null; }
export interface ModelCostEvidence { currency: "EUR"; estimatedCost: number | null; dailyUsage: number | null; monthlyUsage: number | null; dailyLimit: number | null; monthlyLimit: number | null; }
export interface ModelResponse { providerId: string; modelId: string | null; output: Record<string, unknown>; usage: ModelUsage; cost: ModelCostEvidence; testOnly: boolean; }
export interface ModelProvider { id: string; status: "disabled" | "test_only" | "configured"; capabilities: readonly ModelCapability[]; execute(request: ModelRequest): Promise<ModelResponse>; }
