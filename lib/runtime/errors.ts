export type RuntimeErrorCategory = "validation" | "policy" | "conflict" | "source_unavailable" | "execution_failed" | "external_unknown" | "provider_disabled" | "provider_budget";
const semantics = { validation: [400, false, false, false], policy: [403, false, false, false], conflict: [409, true, false, false], source_unavailable: [503, true, false, false], execution_failed: [422, false, false, false], external_unknown: [502, false, false, true], provider_disabled: [503, false, false, false], provider_budget: [503, false, false, false] } as const;
export class RuntimeError extends Error {
  readonly category: RuntimeErrorCategory; readonly status: number; readonly retrySafe: boolean; readonly retryRequiresNewApproval: boolean; readonly manualVerificationRequired: boolean;
  constructor(category: RuntimeErrorCategory, message: string) { super(message); this.name = "RuntimeError"; this.category = category; const value = semantics[category]; this.status = value[0]; this.retrySafe = value[1]; this.retryRequiresNewApproval = value[2]; this.manualVerificationRequired = value[3]; }
}
