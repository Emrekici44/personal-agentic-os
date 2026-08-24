import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { oauthUrl, seal } from "@/lib/google-calendar";
import { publicApiError } from "@/lib/public-api-error";
import { secureCookieForRequest } from "@/lib/request-security";
import { verifyLocalSession } from "@/lib/shared-store";

const headers = { "Cache-Control": "no-store, private" };

export async function GET(req: NextRequest) {
  try {
    if (!verifyLocalSession(req.cookies.get("agentic_os_local_session")?.value)) {
      return NextResponse.json({ error: "Lokale Sitzung erforderlich", externalNavigationStarted: false }, { status: 401, headers });
    }
    const state = crypto.randomBytes(24).toString("base64url");
    const response = NextResponse.redirect(oauthUrl(state));
    response.cookies.set("agentic_os_oauth_state", seal(state), {
      httpOnly: true,
      sameSite: "lax",
      secure: secureCookieForRequest(req),
      maxAge: 600,
      path: "/",
    });
    response.headers.set("Cache-Control", "no-store, private");
    return response;
  } catch (error) {
    return NextResponse.json({ error: publicApiError(error, "Google-Verbindung ist vorübergehend nicht verfügbar"), externalNavigationStarted: false }, { status: 503, headers });
  }
}
