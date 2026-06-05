import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatAmount } from '@/features/finance/constants/finance';
import type { EmployeeWalletSalaryRow } from '@/lib/api/me';

function parseAmount(value: string | null): number {
  if (value == null || value === '') return 0;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

interface WalletPayrollSalaryLinesSectionProps {
  rows: EmployeeWalletSalaryRow[];
  onOpenMonth: (salaryLineId: string) => void;
}

export function WalletPayrollSalaryLinesSection({
  rows,
  onOpenMonth,
}: WalletPayrollSalaryLinesSectionProps) {
  return (
    <section>
      <h2 className="text-foreground mb-3 text-sm font-semibold">Payroll salary lines</h2>
      <div className="border-border overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead className="text-right">Payable</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              <TableHead>Line</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-8 text-center text-sm">
                  No payroll lines yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => onOpenMonth(row.id)}
                      className="text-foreground hover:text-primary font-medium hover:underline"
                    >
                      {row.payrollMonth}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatAmount(parseAmount(row.totalPayable))}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatAmount(parseAmount(row.paidAmount))}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatAmount(parseAmount(row.remainingAmount))}
                  </TableCell>
                  <TableCell className="text-xs">{row.lineStatus}</TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="text-primary h-auto px-0 text-xs"
                      onClick={() => onOpenMonth(row.id)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
