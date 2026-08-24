import type { NextRequest } from "next/server";

function firstHeaderValue(value: string | null) {
  return String(value || "").split(",", 1)[0].trim().toLowerCase();
}

function normalizedHost(value: string | null) {
  const host = firstHeaderValue(value);
  if (host.startsWith("[")) return host.replace(/\]:\d+$/, "]");
  return host.replace(/:\d+$/, "");
}

export function secureCookieForRequest(request: Pick<NextRequest, "headers" | "nextUrl">) {
  if (process.env.NODE_ENV === "production" || request.nextUrl.protocol === "https:") return true;
  const forwardedProto = firstHeaderValue(request.headers.get("x-forwarded-proto"));
  if (forwardedProto !== "https") return false;
  const configuredPrivateHost = normalizedHost(process.env.AGENTIC_OS_PRIVATE_HOST || null);
  const forwardedHost = normalizedHost(request.headers.get("x-forwarded-host") || request.headers.get("host"));
  return Boolean(configuredPrivateHost && forwardedHost === configuredPrivateHost);
}
