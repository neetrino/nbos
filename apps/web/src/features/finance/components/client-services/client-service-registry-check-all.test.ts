import { describe, expect, it, vi } from 'vitest';
import type { ClientServiceRegistryBulkPage } from '@/lib/api/client-service-registry-bulk';
import {
  emptyRegistryBulkCounts,
  RegistryCheckAllStalledError,
  runClientServiceRegistryCheckAll,
} from './client-service-registry-check-all';

function page(overrides: Partial<ClientServiceRegistryBulkPage>): ClientServiceRegistryBulkPage {
  return {
    total: 5,
    checked: 0,
    nextCursor: null,
    done: false,
    counts: emptyRegistryBulkCounts(),
    ...overrides,
  };
}

describe('runClientServiceRegistryCheckAll', () => {
  it('follows the cursor until done and sums the counts', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce(
        page({ checked: 3, nextCursor: 'c', counts: { ...emptyRegistryBulkCounts(), updated: 3 } }),
      )
      .mockResolvedValueOnce(
        page({
          checked: 2,
          nextCursor: 'e',
          done: true,
          counts: { ...emptyRegistryBulkCounts(), updated: 1, not_found: 1 },
        }),
      );
    const onProgress = vi.fn();

    const summary = await runClientServiceRegistryCheckAll({
      fetchPage,
      onProgress,
      isCancelled: () => false,
    });

    expect(fetchPage.mock.calls).toEqual([[null], ['c']]);
    expect(onProgress).toHaveBeenLastCalledWith({ checked: 5, total: 5 });
    expect(summary).toMatchObject({ checked: 5, total: 5, cancelled: false });
    expect(summary.counts).toMatchObject({ updated: 4, not_found: 1 });
  });

  it('stops before the next page when cancelled', async () => {
    let cancelled = false;
    const fetchPage = vi.fn().mockImplementation(async () => {
      cancelled = true;
      return page({ checked: 1, nextCursor: 'a' });
    });

    const summary = await runClientServiceRegistryCheckAll({
      fetchPage,
      onProgress: vi.fn(),
      isCancelled: () => cancelled,
    });

    expect(fetchPage).toHaveBeenCalledOnce();
    expect(summary.cancelled).toBe(true);
  });

  it('throws instead of looping when a page makes no progress', async () => {
    const fetchPage = vi.fn().mockResolvedValue(page({ checked: 0, nextCursor: 'a' }));

    await expect(
      runClientServiceRegistryCheckAll({
        fetchPage,
        onProgress: vi.fn(),
        isCancelled: () => false,
      }),
    ).rejects.toBeInstanceOf(RegistryCheckAllStalledError);
  });
});
