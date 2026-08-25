import type { ExecutionStatus, RetryPolicy } from "../types.ts";

export function calendarOutcomeReceipt(outcome: string): { status: ExecutionStatus; retryPolicy: RetryPolicy; external: true } {
  if (["written_verified", "duplicate_prevented"].includes(outcome)) return { status: "confirmed", retryPolicy: "not_retryable", external: true };
  if (["unknown", "written_unverified", "written_audit_unconfirmed"].includes(outcome)) return { status: "unknown", retryPolicy: "manual_verification_required", external: true };
  if (outcome === "rejected") return { status: "failed", retryPolicy: "new_approval_required", external: true };
  if (outcome === "not_started") return { status: "not_started", retryPolicy: "new_approval_required", external: true };
  return { status: "unknown", retryPolicy: "manual_verification_required", external: true };
}
