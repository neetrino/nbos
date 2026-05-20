'use client';

import { useCallback, useEffect, useState } from 'react';
import { Lock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader, ErrorState, LoadingState } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  financeJournalApi,
  type FinancePostingPeriod,
  type OperationalJournalEntry,
} from '@/lib/api/finance-journal';
import { getApiErrorMessage } from '@/lib/api-errors';
import { toast } from 'sonner';

export default function FinanceJournalPage() {
  const [periods, setPeriods] = useState<FinancePostingPeriod[]>([]);
  const [entries, setEntries] = useState<OperationalJournalEntry[]>([]);
  const [monthFilter, setMonthFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustDate, setAdjustDate] = useState('');
  const [adjustDescription, setAdjustDescription] = useState('');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [periodRows, entryPage] = await Promise.all([
        financeJournalApi.listPeriods(),
        financeJournalApi.listEntries({
          page: 1,
          pageSize: 50,
          monthKey: monthFilter || undefined,
        }),
      ]);
      setPeriods(periodRows);
      setEntries(entryPage.items);
      setError(null);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Journal could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [monthFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleClosePeriod = async (monthKey: string) => {
    if (
      !window.confirm(`Close posting period ${monthKey}? Mutations in that month will be blocked.`)
    ) {
      return;
    }
    try {
      await financeJournalApi.closePeriod(monthKey);
      toast.success(`Period ${monthKey} closed`);
      await load();
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Could not close period.'));
    }
  };

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(adjustAmount.replace(/\s/g, ''));
    if (!Number.isFinite(amount) || amount === 0 || !adjustDate || !adjustDescription.trim()) {
      return;
    }
    setAdjustSubmitting(true);
    try {
      await financeJournalApi.createAdjustment({
        amount,
        bookedAt: new Date(adjustDate).toISOString(),
        description: adjustDescription.trim(),
        recognitionBasis: 'ACCRUAL',
      });
      toast.success('Adjustment posted');
      setAdjustOpen(false);
      setAdjustAmount('');
      setAdjustDate('');
      setAdjustDescription('');
      await load();
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Could not post adjustment.'));
    } finally {
      setAdjustSubmitting(false);
    }
  };

  if (loading) return <LoadingState count={4} />;
  if (error) return <ErrorState description={error} onRetry={() => void load()} />;

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader
        title="Operational journal"
        description="Posting periods, cash/accrual lines, and manual adjustments after period close."
      >
        <Button type="button" size="sm" onClick={() => setAdjustOpen(true)}>
          <Plus size={16} className="mr-1" />
          Manual adjustment
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="journal-month-filter">Filter entries by month</Label>
          <Input
            id="journal-month-filter"
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-44"
          />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setMonthFilter('')}>
          Clear filter
        </Button>
      </div>

      <div className="border-border rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Entries</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {periods.map((period) => (
              <TableRow key={period.id}>
                <TableCell className="font-medium">{period.monthKey}</TableCell>
                <TableCell>{period.status}</TableCell>
                <TableCell className="text-right">{period._count.journalEntries}</TableCell>
                <TableCell className="text-right">
                  {period.status === 'OPEN' ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void handleClosePeriod(period.monthKey)}
                    >
                      <Lock size={14} className="mr-1" />
                      Close
                    </Button>
                  ) : (
                    '—'
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="border-border rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booked</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Basis</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Functional</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{entry.bookedAt.slice(0, 10)}</TableCell>
                <TableCell>
                  {entry.sourceType}
                  <span className="text-muted-foreground block text-xs">
                    {entry.sourceId.slice(0, 8)}
                  </span>
                </TableCell>
                <TableCell>{entry.recognitionBasis}</TableCell>
                <TableCell>{entry.description ?? '—'}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatAmount(Number(entry.functionalAmount))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manual adjustment</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => void handleAdjustment(e)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="adj-amount">Amount (signed)</Label>
              <Input
                id="adj-amount"
                type="number"
                step="any"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="adj-date">Booked date</Label>
              <Input
                id="adj-date"
                type="date"
                value={adjustDate}
                onChange={(e) => setAdjustDate(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="adj-desc">Description</Label>
              <Input
                id="adj-desc"
                value={adjustDescription}
                onChange={(e) => setAdjustDescription(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAdjustOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={adjustSubmitting}>
                {adjustSubmitting ? 'Posting…' : 'Post adjustment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
