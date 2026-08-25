const DEFAULT_MAX_PRIVATE_JSON_BYTES = 64 * 1024;
const DEFAULT_PRIVATE_BODY_TIMEOUT_MS = 5_000;

export function trustedPrivateMutationOrigin(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site")?.trim().toLowerCase();
  if (fetchSite === "cross-site") return false;

  const origin = request.headers.get("origin")?.trim();
  if (!origin) return true;
  if (origin === "null") return false;

  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    const expectedHost = (request.headers.get("host") || requestUrl.host).trim().toLowerCase();
    const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const expectedProtocol = (forwardedProtocol || requestUrl.protocol).replace(/:$/, "").toLowerCase();
    return originUrl.host.toLowerCase() === expectedHost && originUrl.protocol.toLowerCase() === `${expectedProtocol}:`;
  } catch {
    return false;
  }
}

export async function readPrivateJson(
  request: Request,
  maxBytes = DEFAULT_MAX_PRIVATE_JSON_BYTES,
  timeoutMs = DEFAULT_PRIVATE_BODY_TIMEOUT_MS,
): Promise<any> {
  if (!Number.isInteger(maxBytes) || maxBytes < 256 || maxBytes > 1024 * 1024) {
    throw new Error("Ungültige Anfrage: Größenlimit ist nicht zulässig");
  }
  if (!Number.isFinite(timeoutMs) || timeoutMs < 25 || timeoutMs > 30_000) {
    throw new Error("Ungültige Anfrage: Zeitlimit ist nicht zulässig");
  }
  const contentType = request.headers.get("content-type")?.toLowerCase() || "";
  if (!contentType.startsWith("application/json")) {
    throw new Error("Ungültige Anfrage: JSON-Inhalt erwartet");
  }
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > maxBytes)) {
    throw new Error("Ungültige Anfrage: Inhalt ist zu groß");
  }
  if (!request.body) throw new Error("Ungültige Anfrage: JSON-Inhalt fehlt");

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const read = (async () => {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new Error("Ungültige Anfrage: Inhalt ist zu groß");
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  })();
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error("Ungültige Anfrage: Inhalt konnte nicht rechtzeitig gelesen werden"));
      void reader.cancel();
    }, timeoutMs);
  });
  try {
    const text = await Promise.race([read, timeout]);
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Ungültige Anfrage: JSON-Objekt erwartet");
    }
    return parsed;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Ungültige Anfrage:")) throw error;
    throw new Error("Ungültige Anfrage: JSON konnte nicht gelesen werden");
  } finally {
    if (timer) clearTimeout(timer);
  }
}
