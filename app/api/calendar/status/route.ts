import { NextRequest, NextResponse } from "next/server";

import {
  calendarConfig,
  calendarScopes,
  hasStoredToken,
  refreshedAccessToken,
  tokenScopes,
} from "@/lib/google-calendar";
import { verifyLocalSession } from "@/lib/shared-store";

const headers = { "Cache-Control": "no-store, private" };

export async function GET(request: NextRequest) {
  if (!verifyLocalSession(request.cookies.get("agentic_os_local_session")?.value)) {
    return NextResponse.json(
      { error: "Lokale Sitzung erforderlich", credentialsExposed: false },
      { status: 401, headers },
    );
  }

  const cookie = request.cookies.get("agentic_os_google_token")?.value;
  const config = calendarConfig();
  const granted = tokenScopes(cookie);
  let connected = false;
  let connectionCheck: "complete" | "error" = "complete";
  let recentError: string | null = null;

  try {
    connected = Boolean(await refreshedAccessToken(cookie));
  } catch {
    connectionCheck = "error";
    recentError = "Google-Tokenprüfung vorübergehend nicht erreichbar";
  }

  const eventWriteReady =
    connectionCheck === "complete" &&
    connected &&
    calendarScopes.every((scope) => granted.includes(scope));

  return NextResponse.json(
    {
      configured: config.configured,
      connected,
      connectionCheck,
      eventWriteReady,
      sharedWithDesktop: hasStoredToken(),
      mode:
        connectionCheck === "error"
          ? "degraded"
          : connected
            ? "google"
            : config.configured
              ? "oauth-ready"
              : "unconfigured",
      permissions: calendarScopes.map((scope) => scope.split("/").pop()),
      recentError,
      writesEnabled: eventWriteReady,
      writesRequireExactApproval: true,
      backgroundWrites: false,
      deletesEnabled: false,
      credentialsExposed: false,
    },
    { headers },
  );
}
