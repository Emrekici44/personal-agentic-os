const DEFAULT_PRIVATE_TIMEOUT_MS = 8_000;

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
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error("Private Quelle hat das Zeitlimit überschritten"));
      controller.abort();
    }, timeoutMs);
  });
  try {
    return await Promise.race([
      fetch(input, { ...init, signal: controller.signal }),
      timeout,
    ]);
  } finally {
    if (timer) clearTimeout(timer);
    init.signal?.removeEventListener("abort", relayAbort);
  }
}
