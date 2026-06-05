import {
  summarizeWalletBonusForecast,
  type WalletBonusForecastSummary,
} from '@/features/finance/utils/wallet-bonus-forecast-summary';
import type { WalletBonusPipelineGroup } from '@/lib/api/me';
import type { EmployeeWalletSnapshot } from '@/lib/api/me';

function parseAmount(value: string | null | undefined): number {
  if (value == null || value === '') return 0;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export type WalletPipelineSegment = {
  group: WalletBonusPipelineGroup;
  amount: number;
  percent: number;
};

export type WalletOverviewMetrics = {
  displayName: string;
  roleLine: string;
  baseSalary: number;
  bonusSummary: WalletBonusForecastSummary;
  incomingTotal: number;
  earnedTotal: number;
  paidFromPayroll: number;
  heroAmount: number;
  heroLabel: string;
  heroSublabel: string;
  pipelineSegments: WalletPipelineSegment[];
  nextPayrollProgress: number | null;
};

function pipelineSegmentsFromSummary(summary: WalletBonusForecastSummary): WalletPipelineSegment[] {
  const raw: Array<{ group: WalletBonusPipelineGroup; amount: number }> = [
    { group: 'POTENTIAL', amount: summary.incomingPlanned },
    { group: 'IN_PROGRESS', amount: summary.inProgressPlanned },
    { group: 'NEXT_PAYROLL', amount: summary.nextPayrollRemaining },
    { group: 'PAID', amount: summary.paidFromReleases },
    { group: 'CORRECTIONS', amount: Math.abs(summary.correctionsPlanned) },
  ];
  const total = raw.reduce((sum, row) => sum + row.amount, 0);
  if (total <= 0) {
    return raw.map((row) => ({ ...row, percent: 0 }));
  }
  return raw.map((row) => ({
    group: row.group,
    amount: row.amount,
    percent: Math.round((row.amount / total) * 100),
  }));
}

export function computeWalletOverviewMetrics(data: EmployeeWalletSnapshot): WalletOverviewMetrics {
  const { employee } = data;
  const bonusSummary = summarizeWalletBonusForecast(data.bonuses);
  const baseSalary = parseAmount(employee.baseSalary);
  const incomingTotal = bonusSummary.incomingPlanned + bonusSummary.inProgressPlanned;
  const earnedTotal = bonusSummary.nextPayrollRemaining + bonusSummary.paidFromReleases;
  const paidFromPayroll = data.salaryHistory.reduce(
    (sum, row) => sum + parseAmount(row.paidAmount),
    0,
  );

  const nextRemaining = data.nextPayroll ? parseAmount(data.nextPayroll.remainingAmount) : 0;
  const nextTotal = data.nextPayroll ? parseAmount(data.nextPayroll.totalPayable) : 0;
  const nextPaid = data.nextPayroll ? parseAmount(data.nextPayroll.paidAmount) : 0;

  let heroAmount = earnedTotal;
  let heroLabel = 'Earned & in payout';
  let heroSublabel = 'Released bonuses and payroll queue — not a bank balance.';

  if (data.nextPayroll && nextRemaining > 0) {
    heroAmount = nextRemaining;
    heroLabel = `Next payroll · ${data.nextPayroll.payrollMonth}`;
    heroSublabel = 'Remaining on your open salary line this cycle.';
  } else if (data.nextPayroll && nextTotal > 0) {
    heroAmount = nextTotal;
    heroLabel = `Next payroll · ${data.nextPayroll.payrollMonth}`;
    heroSublabel = 'Total payable on your upcoming salary line.';
  }

  const nextPayrollProgress =
    data.nextPayroll && nextTotal > 0
      ? Math.min(100, Math.round((nextPaid / nextTotal) * 100))
      : null;

  const roleParts = [employee.roleName, employee.position, employee.level].filter(Boolean);

  return {
    displayName: `${employee.firstName} ${employee.lastName}`.trim(),
    roleLine: roleParts.join(' · '),
    baseSalary,
    bonusSummary,
    incomingTotal,
    earnedTotal,
    paidFromPayroll,
    heroAmount,
    heroLabel,
    heroSublabel,
    pipelineSegments: pipelineSegmentsFromSummary(bonusSummary),
    nextPayrollProgress,
  };
}
