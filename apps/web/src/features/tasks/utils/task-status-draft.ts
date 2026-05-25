/** Map legacy persisted statuses to workflow values shown in the task sheet. */
export function normalizeTaskStatusForDraft(status: string): string {
  if (status === 'NEW') return 'OPEN';
  if (status === 'DONE') return 'COMPLETED';
  return status;
}
