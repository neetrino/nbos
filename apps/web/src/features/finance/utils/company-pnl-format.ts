import { formatAmount } from '../constants/finance';
import type { CompanyPnlReport } from '@/lib/api/finance-reports';

export function formatCompanyPnlAmount(value: string): string {
  return formatAmount(Number(value));
}

export function formatCompanyPnlMargin(
  margin: CompanyPnlReport['profitability']['marginPercent'],
): string {
  return margin === null ? 'N/A' : `${margin.toFixed(2)}%`;
}
