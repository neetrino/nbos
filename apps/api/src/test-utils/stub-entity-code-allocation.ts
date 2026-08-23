import { vi } from 'vitest';

interface QueryRawMock {
  $queryRaw: {
    mockResolvedValue: (value: unknown) => unknown;
    mockImplementation: (implementation: () => Promise<unknown>) => unknown;
  };
}

/** Stubs the atomic allocator upsert used by every year-scoped series. */
export function stubEntityCodeAllocation(prisma: QueryRawMock, nextValue = 1): void {
  prisma.$queryRaw.mockResolvedValue([{ next_value: nextValue }]);
}

export function stubEntityCodeAllocationSequence(
  prisma: QueryRawMock,
  values: readonly number[],
): void {
  let index = 0;
  prisma.$queryRaw.mockImplementation(() => {
    const nextValue = values[Math.min(index, values.length - 1)] ?? 1;
    index += 1;
    return Promise.resolve([{ next_value: nextValue }]);
  });
}

export function createQueryRawStub(nextValue = 1) {
  return vi.fn().mockResolvedValue([{ next_value: nextValue }]);
}
