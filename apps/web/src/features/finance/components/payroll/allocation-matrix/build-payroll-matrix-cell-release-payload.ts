import type {
  PayrollMatrixCellSavePayload,
  PayrollMatrixCellSourceAmount,
} from '@/lib/api/payroll-allocation-matrix';

const MONEY_SCALE = 2;

export type PayrollMatrixSourceAmountDraft = {
  bonusEntryId: string;
  amount: string;
};

export type PayrollMatrixCellReleaseAmounts = {
  releaseThisMonth: string;
  sourceAmounts?: PayrollMatrixCellSourceAmount[];
};

function parseMoney(value: string): number {
  const n = Number.parseFloat(value.trim());
  return Number.isFinite(n) ? n : 0;
}

function moneyText(value: number): string {
  return value.toFixed(MONEY_SCALE);
}

/**
 * Builds the PATCH cell amount payload from financier drafts.
 * Multi-source cells (≥2) never send a bare total without sourceAmounts.
 */
export function buildPayrollMatrixCellReleasePayload(params: {
  sourceEntryCount: number;
  singleAmount: string;
  sourceDrafts: PayrollMatrixSourceAmountDraft[];
}): PayrollMatrixCellReleaseAmounts {
  if (params.sourceEntryCount < 2) {
    const amount = parseMoney(params.singleAmount);
    return { releaseThisMonth: moneyText(amount) };
  }

  const sourceAmounts: PayrollMatrixCellSourceAmount[] = [];
  let total = 0;
  for (const draft of params.sourceDrafts) {
    const amount = parseMoney(draft.amount);
    if (amount <= 0) continue;
    const text = moneyText(amount);
    sourceAmounts.push({ bonusEntryId: draft.bonusEntryId, amount: text });
    total += amount;
  }

  if (sourceAmounts.length === 0) {
    return { releaseThisMonth: moneyText(0) };
  }

  return {
    releaseThisMonth: moneyText(total),
    sourceAmounts,
  };
}

/**
 * Multi-source blur must not delete a saved release.
 * An untouched cell is skipped. A cleared dirty cell is saved as zero.
 */
export function shouldSkipPayrollMatrixMultiSourceSave(params: {
  dirty: boolean;
  nextAmount: number;
  savedAmount: number;
  drafts: PayrollMatrixSourceAmountDraft[];
  savedIncludedByEntryId: ReadonlyMap<string, number>;
  needsReason: boolean;
  reason: string;
}): boolean {
  if (!params.dirty) return true;
  if (params.needsReason && params.reason.trim().length > 0) return false;
  if (params.nextAmount !== params.savedAmount) return false;
  return params.drafts.every(
    (draft) =>
      parseMoney(draft.amount) === (params.savedIncludedByEntryId.get(draft.bonusEntryId) ?? 0),
  );
}

export function resolvePayrollMatrixCellSubmitPayload(params: {
  isMultiSource: boolean;
  sourceEntryCount: number;
  singleAmount: string;
  sourceDrafts: PayrollMatrixSourceAmountDraft[];
  savedRelease: string;
  sources: { bonusEntryId: string; includedThisMonth?: string }[];
  dirty: boolean;
  needsReason: boolean;
  reason: string;
}): PayrollMatrixCellSavePayload | null {
  const amounts = buildPayrollMatrixCellReleasePayload({
    sourceEntryCount: params.sourceEntryCount,
    singleAmount: params.singleAmount,
    sourceDrafts: params.sourceDrafts,
  });
  const next = parseMoney(amounts.releaseThisMonth);
  const current = parseMoney(params.savedRelease);
  const trimmedReason = params.reason.trim();
  if (skipUnchangedCellSave(params, next, current, trimmedReason)) return null;
  return {
    ...amounts,
    reason: trimmedReason.length > 0 ? trimmedReason : undefined,
  };
}

function skipUnchangedCellSave(
  params: {
    isMultiSource: boolean;
    sourceDrafts: PayrollMatrixSourceAmountDraft[];
    sources: { bonusEntryId: string; includedThisMonth?: string }[];
    dirty: boolean;
    needsReason: boolean;
  },
  next: number,
  current: number,
  trimmedReason: string,
): boolean {
  const skipSingle =
    !params.isMultiSource &&
    next === current &&
    (!params.needsReason || trimmedReason.length === 0);
  const savedIncluded = new Map(
    params.sources.map((source) => [
      source.bonusEntryId,
      parseMoney(source.includedThisMonth ?? ''),
    ]),
  );
  const skipMulti =
    params.isMultiSource &&
    shouldSkipPayrollMatrixMultiSourceSave({
      dirty: params.dirty,
      nextAmount: next,
      savedAmount: current,
      drafts: params.sourceDrafts,
      savedIncludedByEntryId: savedIncluded,
      needsReason: params.needsReason,
      reason: trimmedReason,
    });
  return skipSingle || skipMulti;
}
