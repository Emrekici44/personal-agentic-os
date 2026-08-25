const DEFAULT_PRIVATE_TIMEOUT_MS = 8_000;
export const PRIVATE_RESPONSE_LIMIT_BYTES = 2 * 1024 * 1024;

async function bufferPrivateResponse(response: Response, controller: AbortController) {
  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (Number.isFinite(declaredLength) && declaredLength > PRIVATE_RESPONSE_LIMIT_BYTES) {
    controller.abort();
    throw new Error("Private Antwort überschreitet das Größenlimit");
  }
  const reader = response.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > PRIVATE_RESPONSE_LIMIT_BYTES) {
      await reader.cancel();
      controller.abort();
      throw new Error("Private Antwort überschreitet das Größenlimit");
    }
    chunks.push(value);
  }
  if (!total) return null;
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export async function privateApiFetch(
  input: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_PRIVATE_TIMEOUT_MS,
) {
  if (!/^\/api\/[a-z0-9/_?&=.%+-]*$/i.test(input)) {
    throw new Error("Nur relative private API-Pfade sind erlaubt");
  }
  if (!Number.isFinite(timeoutMs) || timeoutMs < 50 || timeoutMs > 30_000) {
    throw new Error("Ungültiges privates Request-Zeitlimit");
  }
  const controller = new AbortController();
  const relayAbort = () => controller.abort();
  init.signal?.addEventListener("abort", relayAbort, { once: true });
  if (init.signal?.aborted) controller.abort();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error("Private Quelle hat das Zeitlimit überschritten"));
      controller.abort();
    }, timeoutMs);
  });
  try {
    return await Promise.race([
      fetch(input, { ...init, signal: controller.signal }).then(async (response) => {
        const body = await bufferPrivateResponse(response, controller);
        return new Response(body, {
          headers: response.headers,
          status: response.status,
          statusText: response.statusText,
        });
      }),
      timeout,
    ]);
  } finally {
    if (timer) clearTimeout(timer);
    init.signal?.removeEventListener("abort", relayAbort);
  }
}
