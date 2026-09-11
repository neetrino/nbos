import { vi } from 'vitest';

export function commandLockMocks(command: Record<string, unknown>) {
  return {
    $queryRaw: vi.fn(async () => [{ ...command }]),
    messengerCommand: {
      findUnique: vi.fn(async () => ({ ...command })),
      updateMany: vi.fn(async ({ data }: { data?: Record<string, unknown> }) => {
        if (data) Object.assign(command, data);
        return { count: 1 };
      }),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        Object.assign(command, data);
        return command;
      }),
      count: vi.fn().mockResolvedValue(1),
    },
  };
}
