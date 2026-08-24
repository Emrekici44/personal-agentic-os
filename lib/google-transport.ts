export const GOOGLE_REQUEST_TIMEOUT_MS = 8_000;

export function googleRequestSignal() {
  return AbortSignal.timeout(GOOGLE_REQUEST_TIMEOUT_MS);
}
