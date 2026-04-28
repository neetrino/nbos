/** Milestone kinds we can derive from durable `payroll_runs` columns (no audit trail yet). */
export type PayrollJournalKind = 'CREATED' | 'APPROVED' | 'CLOSED';

export interface PayrollJournalEntry {
  kind: PayrollJournalKind;
  /** ISO-8601 instant */
  at: string;
  actorEmployeeId: string | null;
  actorName: string | null;
  summary: string;
}

export interface PayrollRunJournalSource {
  createdAt: Date | string;
  approvedAt: Date | string | null;
  closedAt: Date | string | null;
  createdBy: { id: string; firstName: string; lastName: string } | null;
  approvedBy: { id: string; firstName: string; lastName: string } | null;
}

const KIND_ORDER: Record<PayrollJournalKind, number> = {
  CREATED: 0,
  APPROVED: 1,
  CLOSED: 2,
};

function displayName(employee: { firstName: string; lastName: string } | null): string | null {
  if (!employee) return null;
  const name = `${employee.firstName} ${employee.lastName}`.trim();
  return name.length > 0 ? name : null;
}

function toIso(value: Date | string): string {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

function pushEntry(
  out: PayrollJournalEntry[],
  entry: Omit<PayrollJournalEntry, 'at'> & { at: Date | string },
): void {
  out.push({
    ...entry,
    at: toIso(entry.at),
  });
}

/**
 * Read-only timeline from payroll run timestamps. Does not list intermediate status hops
 * (REVIEW, PAYING) until NBOS audit rows exist for payroll runs.
 */
export function buildPayrollRunJournal(run: PayrollRunJournalSource): PayrollJournalEntry[] {
  const entries: PayrollJournalEntry[] = [];

  pushEntry(entries, {
    kind: 'CREATED',
    at: run.createdAt,
    actorEmployeeId: run.createdBy?.id ?? null,
    actorName: displayName(run.createdBy),
    summary: 'Payroll run created',
  });

  if (run.approvedAt) {
    pushEntry(entries, {
      kind: 'APPROVED',
      at: run.approvedAt,
      actorEmployeeId: run.approvedBy?.id ?? null,
      actorName: displayName(run.approvedBy),
      summary: 'Run approved (payable lines materialize to expense cards when applicable)',
    });
  }

  if (run.closedAt) {
    pushEntry(entries, {
      kind: 'CLOSED',
      at: run.closedAt,
      actorEmployeeId: null,
      actorName: null,
      summary: 'Run closed',
    });
  }

  entries.sort((a, b) => {
    const byTime = a.at.localeCompare(b.at);
    if (byTime !== 0) return byTime;
    return KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
  });

  return entries;
}
