import { Button } from '@/components/ui/button';
import { WalletPayrollSalaryLinesSection } from '@/features/account/components/wallet-payroll-salary-lines-section';
import { WalletSalaryMonthCards } from '@/features/account/components/wallet-salary-month-cards';
import { formatAmount } from '@/features/finance/constants/finance';
import type { EmployeeWalletSnapshot } from '@/lib/api/me';

function parseAmount(value: string | null | undefined): number {
  if (value == null || value === '') return 0;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

interface WalletPayrollTabProps {
  data: EmployeeWalletSnapshot;
  openSalaryLineId: string | null;
  onOpenMonth: (salaryLineId: string) => void;
}

export function WalletPayrollTab({ data, openSalaryLineId, onOpenMonth }: WalletPayrollTabProps) {
  const { nextPayroll } = data;

  return (
    <div className="space-y-6 px-5 py-4">
      {nextPayroll ? (
        <section className="border-border bg-card rounded-2xl border p-5">
          <h2 className="text-foreground text-sm font-semibold">Next payroll line</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            {nextPayroll.payrollMonth} · {nextPayroll.lineStatus}
          </p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <p className="text-foreground text-2xl font-semibold tabular-nums">
              {formatAmount(parseAmount(nextPayroll.totalPayable))}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenMonth(nextPayroll.salaryLineId)}
            >
              Month details
            </Button>
          </div>
        </section>
      ) : null}

      <section className="border-border bg-card rounded-2xl border p-5">
        <h2 className="text-foreground text-sm font-semibold">Salary by month</h2>
        <p className="text-muted-foreground mt-1 text-xs leading-snug">
          Accumulating, active payout, and paid — open any month for the full breakdown.
        </p>
        <div className="mt-4">
          <WalletSalaryMonthCards
            rows={data.salaryHistory}
            onOpenMonth={onOpenMonth}
            highlightSalaryLineId={openSalaryLineId}
          />
        </div>
      </section>

      <WalletPayrollSalaryLinesSection rows={data.salaryHistory} onOpenMonth={onOpenMonth} />
    </div>
  );
}
