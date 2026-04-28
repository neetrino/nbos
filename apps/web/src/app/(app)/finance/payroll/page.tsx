'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import { payrollRunsListPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import { PAYROLL_RUN_STATUS_LABEL } from '@/features/finance/constants/payroll-run-ui';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import { getApiErrorMessage } from '@/lib/api-errors';
import { payrollRunsApi, type PayrollRunListRow } from '@/lib/api/payroll-runs';

function defaultPayrollMonth(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export default function PayrollRunsPage() {
  useFinanceDocumentTitle(payrollRunsListPageTitle());

  const [items, setItems] = useState<PayrollRunListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [month, setMonth] = useState(defaultPayrollMonth);
  const [seedLines, setSeedLines] = useState(true);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await payrollRunsApi.getAll({
        pageSize: 100,
        sortBy: 'payrollMonth',
        sortOrder: 'desc',
      });
      setItems(data.items);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Payroll runs could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const defaultMonthValue = useMemo(() => defaultPayrollMonth(), []);

  const openDialog = useCallback(() => {
    setMonth(defaultMonthValue);
    setSeedLines(true);
    setCreateError(null);
    setDialogOpen(true);
  }, [defaultMonthValue]);

  const submitCreate = useCallback(async () => {
    setCreating(true);
    setCreateError(null);
    try {
      await payrollRunsApi.create({ payrollMonth: month, seedLines });
      setDialogOpen(false);
      await load();
    } catch (caught) {
      setCreateError(getApiErrorMessage(caught, 'Payroll run could not be created.'));
    } finally {
      setCreating(false);
    }
  }, [month, seedLines, load]);

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader
        title="Payroll"
        description="Monthly payroll runs (NBOS Draft → Closed workflow)."
      >
        <Button variant="outline" size="icon" onClick={() => void load()} aria-label="Refresh">
          <RefreshCcw size={16} />
        </Button>
        <Button onClick={openDialog}>
          <Plus size={16} className="mr-1.5" />
          New run
        </Button>
      </PageHeader>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState description={error} onRetry={() => void load()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No payroll runs yet"
          description="Create a run for a calendar month. Salary lines can be seeded from employee base salaries."
          action={
            <Button type="button" onClick={openDialog}>
              New run
            </Button>
          }
        />
      ) : (
        <div className="border-border overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Lines</TableHead>
                <TableHead className="text-right">Total payable</TableHead>
                <TableHead className="text-right">Paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link
                      href={`/finance/payroll/${row.id}`}
                      className="text-primary font-medium hover:underline"
                    >
                      {row.payrollMonth}
                    </Link>
                  </TableCell>
                  <TableCell>{PAYROLL_RUN_STATUS_LABEL[row.status]}</TableCell>
                  <TableCell className="text-right">{row._count.salaryLines}</TableCell>
                  <TableCell className="text-right">
                    {formatAmount(parseAmount(row.totalPayable))}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatAmount(parseAmount(row.totalPaid))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New payroll run</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="payroll-month">Payroll month (YYYY-MM)</Label>
              <input
                id="payroll-month"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={seedLines}
                onChange={(e) => setSeedLines(e.target.checked)}
                className="border-input size-4 rounded border"
              />
              Seed salary lines from active employees (uses current base salary)
            </label>
            {createError ? <p className="text-destructive text-sm">{createError}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={creating} onClick={() => void submitCreate()}>
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
