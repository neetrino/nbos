export const EXTENSION_ACTIVE_STATUSES = ['NEW', 'DEVELOPMENT', 'QA', 'TRANSFER'] as const;

const STATUS_FLOW: Record<string, string> = {
  NEW: 'DEVELOPMENT',
  DEVELOPMENT: 'QA',
  QA: 'TRANSFER',
  TRANSFER: 'DONE',
};

export function getNextExtensionStatus(current: string): string | null {
  return STATUS_FLOW[current] ?? null;
}

export function isActiveExtensionStatus(status: string): boolean {
  return EXTENSION_ACTIVE_STATUSES.some((activeStatus) => activeStatus === status);
}
