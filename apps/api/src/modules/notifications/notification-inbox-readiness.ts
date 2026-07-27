export type InboxDryRunReport = {
  scanned: number;
  matched: number;
  drifted: number;
  missing: number;
  negative: number;
  maxAbsoluteDrift: number;
  repaired: number;
  mode: 'dry-run' | 'repair';
};

export type InboxReadinessDecision = 'READY' | 'NOT_READY';

export type InboxReadinessResult = {
  decision: InboxReadinessDecision;
  reasons: string[];
  report: InboxDryRunReport;
  writeEnabled: boolean;
  reconcileEnabled: boolean;
};

export function evaluateInboxStateReadiness(input: {
  report: InboxDryRunReport;
  writeEnabled: boolean;
  reconcileEnabled: boolean;
  lastReconciliationSucceeded: boolean;
  maxDriftedRows?: number;
  maxMissingRows?: number;
  maxAbsoluteDrift?: number;
}): InboxReadinessResult {
  const maxDrifted = input.maxDriftedRows ?? 0;
  const maxMissing = input.maxMissingRows ?? 0;
  const maxAbs = input.maxAbsoluteDrift ?? 0;
  const reasons: string[] = [];

  if (!input.writeEnabled) reasons.push('WRITE_DISABLED');
  if (!input.reconcileEnabled) reasons.push('RECONCILE_DISABLED');
  if (!input.lastReconciliationSucceeded) reasons.push('LAST_RECONCILIATION_FAILED');
  if (input.report.drifted > maxDrifted) {
    reasons.push(`DRIFTED=${input.report.drifted}>${maxDrifted}`);
  }
  if (input.report.missing > maxMissing) {
    reasons.push(`MISSING=${input.report.missing}>${maxMissing}`);
  }
  if (input.report.negative > 0) {
    reasons.push(`NEGATIVE=${input.report.negative}`);
  }
  if (input.report.maxAbsoluteDrift > maxAbs) {
    reasons.push(`MAX_ABS_DRIFT=${input.report.maxAbsoluteDrift}>${maxAbs}`);
  }

  return {
    decision: reasons.length === 0 ? 'READY' : 'NOT_READY',
    reasons,
    report: input.report,
    writeEnabled: input.writeEnabled,
    reconcileEnabled: input.reconcileEnabled,
  };
}
