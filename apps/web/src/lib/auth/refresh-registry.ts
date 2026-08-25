/**
 * Single-flight refresh registry for Next.js BFF.
 * Concurrent 401s share one Nest refresh and the same rotated tokens.
 */

export type SharedBackendRefresh = {
  accessToken: string;
  setCookie?: string;
};

type RefreshFn = () => Promise<SharedBackendRefresh | null>;

let inflight: Promise<SharedBackendRefresh | null> | null = null;

export async function runSingleFlightRefresh(
  refresh: RefreshFn,
): Promise<SharedBackendRefresh | null> {
  if (inflight) {
    return inflight;
  }
  inflight = (async () => {
    try {
      return await refresh();
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function resetRefreshRegistryForTests(): void {
  inflight = null;
}
