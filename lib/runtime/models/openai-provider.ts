import { providerPolicy, assertRequestAllowed } from "../../openai-provider.mjs";
import type { ModelProvider } from "./types.ts";
export function createOpenAIProviderBoundary(env: Record<string, string | undefined> = process.env): ModelProvider {
  const policy = providerPolicy(env), enabled = policy.mode === "api" && policy.configured && !policy.killSwitch && policy.dailyLimit > 0 && policy.monthlyLimit > 0 && env.OPENAI_PROVIDER_ENABLED === "true";
  return { id: "openai", status: enabled ? "configured" : "disabled", capabilities: ["structured_output", "reasoning", "tool_planning"], async execute() { assertRequestAllowed(policy); throw new Error("OpenAI Transport ist in dieser Runtime nicht aktiviert"); } };
}
