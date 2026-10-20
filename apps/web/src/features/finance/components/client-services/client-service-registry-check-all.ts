import type {
  ClientServiceRegistryBulkCounts,
  ClientServiceRegistryBulkPage,
} from '@/lib/api/client-service-registry-bulk';

export interface RegistryCheckAllProgress {
  checked: number;
  total: number;
}

export interface RegistryCheckAllSummary extends RegistryCheckAllProgress {
  counts: ClientServiceRegistryBulkCounts;
  cancelled: boolean;
}

export class RegistryCheckAllStalledError extends Error {
  constructor() {
    super('Registry check made no progress');
    this.name = 'RegistryCheckAllStalledError';
  }
}

export function emptyRegistryBulkCounts(): ClientServiceRegistryBulkCounts {
  return {
    updated: 0,
    corrected: 0,
    unchanged: 0,
    not_found: 0,
    no_expiry: 0,
    failed: 0,
    skipped: 0,
  };
}

function addCounts(
  into: ClientServiceRegistryBulkCounts,
  page: ClientServiceRegistryBulkCounts,
): void {
  for (const key of Object.keys(into) as Array<keyof ClientServiceRegistryBulkCounts>) {
    into[key] += page[key] ?? 0;
  }
}

/** Pulls server pages until `done`; the server keeps no run state, the cursor is ours. */
export async function runClientServiceRegistryCheckAll(options: {
  fetchPage: (cursor: string | null) => Promise<ClientServiceRegistryBulkPage>;
  onProgress: (progress: RegistryCheckAllProgress) => void;
  isCancelled: () => boolean;
}): Promise<RegistryCheckAllSummary> {
  const counts = emptyRegistryBulkCounts();
  let cursor: string | null = null;
  let checked = 0;
  let total = 0;
  for (;;) {
    if (options.isCancelled()) return { checked, total, counts, cancelled: true };
    const page = await options.fetchPage(cursor);
    checked += page.checked;
    total = Math.max(page.total, checked);
    addCounts(counts, page.counts);
    options.onProgress({ checked, total });
    if (page.done) return { checked, total, counts, cancelled: false };
    if (page.checked === 0 || !page.nextCursor) throw new RegistryCheckAllStalledError();
    cursor = page.nextCursor;
  }
}
