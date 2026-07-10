export const META_PROFILE_FETCH_TIMEOUT_MS = 2500;

export type MetaFetchJsonResult = {
  ok: boolean;
  status: number;
  body: unknown;
};

/** Fetches JSON with a hard timeout; never throws on HTTP or abort errors. */
export async function fetchJsonWithTimeout(
  url: string,
  init: RequestInit | undefined,
  timeoutMs: number,
): Promise<MetaFetchJsonResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    return { ok: response.ok, status: response.status, body };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { ok: false, status: 0, body: { error: { message: 'Profile lookup timed out' } } };
    }
    const message = error instanceof Error ? error.message : 'Profile lookup failed';
    return { ok: false, status: 0, body: { error: { message } } };
  } finally {
    clearTimeout(timer);
  }
}
