/**
 * Single-flight refresh registry for Next.js BFF.
 * All concurrent 401s await the same Promise; max one retry of the original request.
 */

type RefreshFn = () => Promise<boolean>;

let inflight: Promise<boolean> | null = null;

export async function runSingleFlightRefresh(refresh: RefreshFn): Promise<boolean> {
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
