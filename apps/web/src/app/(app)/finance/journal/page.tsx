'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NbosMoneyInput } from '@/components/shared/NbosMoneyInput';
import { Label } from '@/components/ui/label';
import { IntegratedSearchFilters, NbosDatePicker, useModuleHeroSlots } from '@/components/shared';
import { FinanceOverviewPageSettingsSheet } from '@/features/finance/components/overview/FinanceOverviewPageSettingsSheet';
import {
  FinanceJournalEntriesTable,
  FinanceJournalPeriodsTable,
} from '@/features/finance/components/journal/FinanceJournalListTables';
import { financeJournalPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ErrorState, LoadingState } from '@/components/shared';
import {
  financeJournalApi,
  type FinancePostingPeriod,
  type OperationalJournalEntry,
} from '@/lib/api/finance-journal';
import { getApiErrorMessage } from '@/lib/api-errors';
import { toast } from 'sonner';

const JOURNAL_MONTH_FILTER_KEY = 'month';

export default function FinanceJournalPage() {
  useFinanceDocumentTitle(financeJournalPageTitle());

  const [periods, setPeriods] = useState<FinancePostingPeriod[]>([]);
  const [entries, setEntries] = useState<OperationalJournalEntry[]>([]);
  const [search, setSearch] = useState('');
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

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setMonthFilter('');
  }, []);

  const moduleHeroSlots = useMemo(
    () => ({
      search: (
        <IntegratedSearchFilters
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by description, source, amount…"
          filters={[
            {
              key: JOURNAL_MONTH_FILTER_KEY,
              label: 'Entry month',
              fieldType: 'month',
              options: [],
            },
          ]}
          filterValues={{ [JOURNAL_MONTH_FILTER_KEY]: monthFilter }}
          onFilterChange={(key, value) => {
            if (key === JOURNAL_MONTH_FILTER_KEY) {
              setMonthFilter(value);
            }
          }}
          onClearAll={handleClearFilters}
        />
      ),
      trailing: (
        <>
          <FinanceOverviewPageSettingsSheet
            title="Journal — settings"
            description="Reload posting periods and journal entries."
            triggerAriaLabel="Journal settings"
            refreshDisabled={loading}
            onRefresh={() => void load()}
          />
          <Button type="button" onClick={() => setAdjustOpen(true)}>
            <Plus size={16} aria-hidden />
            Manual adjustment
          </Button>
        </>
      ),
    }),
    [handleClearFilters, load, loading, monthFilter, search],
  );

  useModuleHeroSlots(moduleHeroSlots);

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return entries;
    return entries.filter((entry) => {
      const haystack = [
        entry.description,
        entry.sourceType,
        entry.sourceId,
        entry.recognitionBasis,
        entry.functionalAmount,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [entries, search]);

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
    <div className="flex h-full min-h-0 flex-col gap-5">
      <FinanceJournalPeriodsTable
        periods={periods}
        onClosePeriod={(monthKey) => void handleClosePeriod(monthKey)}
      />
      <FinanceJournalEntriesTable entries={filteredEntries} />

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manual adjustment</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => void handleAdjustment(e)} className="flex flex-col gap-4">
            <NbosMoneyInput
              id="adj-amount"
              label="Amount (signed)"
              value={adjustAmount}
              onChange={setAdjustAmount}
              required
            />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="adj-date">Booked date</Label>
              <NbosDatePicker
                id="adj-date"
                value={adjustDate}
                onChange={setAdjustDate}
                aria-label="Booked date"
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
