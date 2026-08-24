export type RuntimeSourceState = "checking" | "online" | "offline";

export function runtimeHealthTransition(
  previous: RuntimeSourceState,
  next: Exclude<RuntimeSourceState, "checking">,
) {
  return {
    state: next,
    recovered: previous === "offline" && next === "online",
  } as const;
}
