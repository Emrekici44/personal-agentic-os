import { ModelFailure, type ModelCapability, type ModelProvider, type ModelRequest } from "./types.ts";
import {createOpenAIProviderBoundary} from "./openai-provider.ts";

export class ModelProviderDisabledError extends ModelFailure { constructor() { super("provider_disabled","Model Provider ist nicht aktiviert"); this.name = "ModelProviderDisabledError"; } }
const disabled: ModelProvider = { id: "disabled", status: "disabled", capabilities: [], async execute() { throw new ModelProviderDisabledError(); } };
export function createModelRouter(providers: readonly ModelProvider[] = [disabled], allowTestProviders = false) {
  return { async execute(request: ModelRequest) { if(request.policy.privacy!=="private"&&request.policy.privacy!=="test_fixture")throw new ModelProviderDisabledError();const provider = providers.find((item) => item.status === "configured" || (allowTestProviders && request.policy.privacy==="test_fixture" && item.status === "test_only")); if (!provider) throw new ModelProviderDisabledError(); const required:ModelCapability[]=["structured_output",...(request.policy.toolPlanning?["tool_planning" as const]:[])];if(required.some(item=>!provider.capabilities.includes(item))) throw new ModelFailure("policy_blocked","Provider unterstützt die geforderte Capability nicht"); const response=await provider.execute(request);if(response.cost.estimatedCost!=null&&request.policy.costClass==="zero"&&response.cost.estimatedCost!==0)throw new ModelFailure("budget_exceeded","Provider-Kostenrichtlinie wurde verletzt");return response; } };
}
export const productionModelRouter = createModelRouter([createOpenAIProviderBoundary()]);
