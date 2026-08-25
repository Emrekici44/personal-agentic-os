import type { ModelProvider, ModelRequest } from "./types.ts";

export class ModelProviderDisabledError extends Error { constructor() { super("Model Provider ist nicht aktiviert"); this.name = "ModelProviderDisabledError"; } }
const disabled: ModelProvider = { id: "disabled", status: "disabled", capabilities: [], async execute() { throw new ModelProviderDisabledError(); } };
export function createModelRouter(providers: readonly ModelProvider[] = [disabled], allowTestProviders = false) {
  return { async execute(request: ModelRequest) { const provider = providers.find((item) => item.status === "configured" || (allowTestProviders && item.status === "test_only")); if (!provider) throw new ModelProviderDisabledError(); if (!provider.capabilities.includes("structured_output")) throw new Error("Provider unterstützt keinen strukturierten Output"); return provider.execute(request); } };
}
export const productionModelRouter = createModelRouter();
