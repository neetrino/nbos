import { formatAmount } from '@/features/finance/constants/finance';
import { parseBonusPoolAmount } from '@/features/finance/utils/bonus-pool-amount';
import type { BonusPoolEmployeeLine } from '@/lib/api/bonus';

const PREVIEW_TOP = 3;

/** Short label for pool cards: "Name · planned". */
export function formatBonusPoolEmployeePreviewLine(line: BonusPoolEmployeeLine): string {
  const planned = parseBonusPoolAmount(line.plannedAmount);
  return `${line.employeeName} · ${formatAmount(planned)}`;
}

export function topBonusPoolEmployeePreviewLines(
  lines: readonly BonusPoolEmployeeLine[],
  limit = PREVIEW_TOP,
): BonusPoolEmployeeLine[] {
  return [...lines].slice(0, limit);
}
