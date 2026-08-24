import { NextRequest, NextResponse } from "next/server";
import { calendarConfig, open, seal, storeTokenBundle } from "@/lib/google-calendar";
import { googleRequestSignal } from "@/lib/google-transport";
import { secureCookieForRequest } from "@/lib/request-security";

const protectRedirect = (response: NextResponse) => {
  response.headers.set("Cache-Control", "no-store, private");
  return response;
};

export async function GET(req: NextRequest) {
  const config = calendarConfig();
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const stored = req.cookies.get("agentic_os_oauth_state")?.value;
  try {
    if (!config.configured || !code || !state || !stored || open(stored) !== state) throw new Error("OAuth-Prüfung fehlgeschlagen");
    const body = new URLSearchParams({
      code,
      client_id: config.clientId!,
      client_secret: config.clientSecret!,
      redirect_uri: `${config.appUrl}/api/calendar/callback`,
      grant_type: "authorization_code",
    });
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
      signal: googleRequestSignal(),
    });
    if (!tokenResponse.ok) throw new Error("Google Token-Austausch fehlgeschlagen");
    const data = { ...(await tokenResponse.json()), obtained_at: Date.now() };
    storeTokenBundle(JSON.stringify(data));
    const response = NextResponse.redirect(`${config.appUrl}/?calendar=connected`);
    response.cookies.set("agentic_os_google_token", seal(JSON.stringify(data)), {
      httpOnly: true,
      sameSite: "lax",
      secure: secureCookieForRequest(req),
      maxAge: data.expires_in || 3600,
      path: "/",
    });
    response.cookies.delete("agentic_os_oauth_state");
    return protectRedirect(response);
  } catch {
    const response = NextResponse.redirect(`${config.appUrl || req.nextUrl.origin}/?calendar=error`);
    response.cookies.delete("agentic_os_oauth_state");
    return protectRedirect(response);
  }
}
