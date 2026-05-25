'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ErrorState, LoadingState, PageHero } from '@/components/shared';
import { bonusesApi, type SalesBonusPaymentModel, type SalesBonusPolicyRow } from '@/lib/api/bonus';

const PAYMENT_MODEL_LABEL: Record<SalesBonusPaymentModel, string> = {
  CLASSIC: 'Classic (order total)',
  SUBSCRIPTION_FIRST_MONTH: 'Subscription (1st paid invoice)',
  SUBSCRIPTION_RECURRING: 'Subscription (month 2+ per paid invoice)',
};

function parsePercentInput(raw: string): number | null {
  const n = Number.parseFloat(raw.replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  return n;
}

export default function SalesBonusPoliciesPage() {
  const [rows, setRows] = useState<SalesBonusPolicyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await bonusesApi.getSalesPolicies();
      setRows(data);
      setError(null);
    } catch {
      setError('Sales bonus policies could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveRow = async (row: SalesBonusPolicyRow, draft: RowDraft) => {
    const seller = parsePercentInput(draft.sellerPercent);
    const assistant = parsePercentInput(draft.assistantPercent);
    if (seller === null || seller < 0 || seller > 100) return;
    if (assistant === null || assistant < 0 || assistant > 100) return;

    setSavingId(row.id);
    try {
      const updated = await bonusesApi.patchSalesPolicy(row.id, {
        sellerPercent: seller,
        assistantPercent: assistant,
        isActive: draft.isActive,
      });
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch {
      setError('Save failed. Try again or refresh the page.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        title="Sales bonus policies"
        trailing={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void load()}
            disabled={loading}
          >
            Refresh
          </Button>
        }
      />
      <p className="text-muted-foreground text-sm">
        Seller and assistant percentages by CRM From category and payment model (classic on first
        fully paid tranche; subscription: first paid invoice, then month 2+ per invoice when rates
        are set).
      </p>

      {loading ? (
        <LoadingState variant="cards" count={2} />
      ) : error ? (
        <ErrorState description={error} onRetry={() => void load()} />
      ) : (
        <div className="border-border bg-card overflow-x-auto rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From (category)</TableHead>
                <TableHead>Payment model</TableHead>
                <TableHead className="w-28">Seller %</TableHead>
                <TableHead className="w-28">Assistant %</TableHead>
                <TableHead className="w-24">Active</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <PolicyRowEditor
                  key={row.id}
                  row={row}
                  saving={savingId === row.id}
                  onSave={(draft) => void saveRow(row, draft)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

interface RowDraft {
  sellerPercent: string;
  assistantPercent: string;
  isActive: boolean;
}

function PolicyRowEditor({
  row,
  saving,
  onSave,
}: {
  row: SalesBonusPolicyRow;
  saving: boolean;
  onSave: (draft: RowDraft) => void;
}) {
  const [sellerPercent, setSellerPercent] = useState(row.sellerPercent);
  const [assistantPercent, setAssistantPercent] = useState(row.assistantPercent);
  const [isActive, setIsActive] = useState(row.isActive);

  const dirty =
    sellerPercent !== row.sellerPercent ||
    assistantPercent !== row.assistantPercent ||
    isActive !== row.isActive;

  useEffect(() => {
    setSellerPercent(row.sellerPercent);
    setAssistantPercent(row.assistantPercent);
    setIsActive(row.isActive);
  }, [row]);

  return (
    <TableRow>
      <TableCell className="font-medium">{row.fromCategory}</TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {PAYMENT_MODEL_LABEL[row.paymentModel]}
      </TableCell>
      <TableCell>
        <Input
          type="text"
          inputMode="decimal"
          className="h-8"
          value={sellerPercent}
          onChange={(e) => setSellerPercent(e.target.value)}
          aria-label="Seller percent"
        />
      </TableCell>
      <TableCell>
        <Input
          type="text"
          inputMode="decimal"
          className="h-8"
          value={assistantPercent}
          onChange={(e) => setAssistantPercent(e.target.value)}
          aria-label="Assistant percent"
        />
      </TableCell>
      <TableCell>
        <Switch checked={isActive} onCheckedChange={setIsActive} aria-label="Policy active" />
      </TableCell>
      <TableCell className="text-right">
        <Button
          size="sm"
          disabled={!dirty || saving}
          onClick={() => onSave({ sellerPercent, assistantPercent, isActive })}
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </TableCell>
    </TableRow>
  );
}
