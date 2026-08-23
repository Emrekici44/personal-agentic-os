export type WebConfig =
  | { mode: "lan" | "private-https"; ok: true; origin: string; url: string }
  | { ok: false; reason: string };

export function getWebConfig(): WebConfig {
  const configuredUrl = process.env.EXPO_PUBLIC_AGENTIC_OS_URL?.trim();

  if (!configuredUrl) {
    return {
      ok: false,
      reason: "Die private Laptop-Adresse wurde noch nicht gesetzt.",
    };
  }

  try {
    const parsed = new URL(configuredUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("unsupported protocol");
    }

    return {
      mode: parsed.protocol === "https:" ? "private-https" : "lan",
      ok: true,
      origin: parsed.origin,
      url: parsed.toString(),
    };
  } catch {
    return {
      ok: false,
      reason: "Die konfigurierte Web-Adresse ist ungültig.",
    };
  }
}
