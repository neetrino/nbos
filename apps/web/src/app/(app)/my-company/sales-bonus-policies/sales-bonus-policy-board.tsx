'use client';

import { useEffect, useState } from 'react';
import { BadgePercent, Receipt, Repeat } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { SalesBonusPaymentModel, SalesBonusPolicyRow } from '@/lib/api/bonus';

const MODEL_ORDER: readonly SalesBonusPaymentModel[] = [
  'CLASSIC',
  'SUBSCRIPTION_FIRST_MONTH',
  'SUBSCRIPTION_RECURRING',
];

const MODEL_COPY: Record<
  SalesBonusPaymentModel,
  { title: string; hint: string; icon: LucideIcon }
> = {
  CLASSIC: {
    title: 'Classic',
    hint: 'Order total, first fully paid tranche',
    icon: Receipt,
  },
  SUBSCRIPTION_FIRST_MONTH: {
    title: 'Subscription',
    hint: "One month's amount, after the first invoice is paid",
    icon: BadgePercent,
  },
  SUBSCRIPTION_RECURRING: {
    title: 'Later months',
    hint: 'Each invoice after the first. Zero pays no bonus',
    icon: Repeat,
  },
};

export interface RowDraft {
  sellerPercent: string;
  assistantPercent: string;
  isActive: boolean;
}

function groupByCategory(rows: SalesBonusPolicyRow[]): SalesBonusPolicyRow[][] {
  const groups = new Map<string, SalesBonusPolicyRow[]>();
  for (const row of rows) {
    const list = groups.get(row.fromCategory) ?? [];
    list.push(row);
    groups.set(row.fromCategory, list);
  }
  return [...groups.values()].map((group) =>
    [...group].sort(
      (left, right) =>
        MODEL_ORDER.indexOf(left.paymentModel) - MODEL_ORDER.indexOf(right.paymentModel),
    ),
  );
}

export function SalesBonusPolicyBoard({
  rows,
  savingId,
  onSave,
}: {
  rows: SalesBonusPolicyRow[];
  savingId: string | null;
  onSave: (row: SalesBonusPolicyRow, draft: RowDraft) => void;
}) {
  const groups = groupByCategory(rows);
  return (
    <div className="@container">
      <div className="grid items-start gap-4 @min-[76rem]:grid-cols-2">
        {groups.map((group) => (
          <CategoryRateCard
            key={group[0]?.fromCategory}
            rows={group}
            savingId={savingId}
            onSave={onSave}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryRateCard({
  rows,
  savingId,
  onSave,
}: {
  rows: SalesBonusPolicyRow[];
  savingId: string | null;
  onSave: (row: SalesBonusPolicyRow, draft: RowDraft) => void;
}) {
  const category = rows[0]?.fromCategory ?? '';
  const activeCount = rows.filter((row) => row.isActive).length;
  return (
    <section className="border-border bg-card relative flex flex-col overflow-hidden rounded-2xl border p-4">
      <div className="bg-primary/15 pointer-events-none absolute -top-12 -right-8 size-28 rounded-full blur-2xl" />
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
            <BadgePercent size={15} />
          </div>
          <h2 className="text-foreground truncate text-sm font-semibold">{category}</h2>
        </div>
        <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">
          {activeCount}/{rows.length}
        </span>
      </div>
      <ul className="relative mt-3 flex flex-col gap-1">
        {rows.map((row) => (
          <PolicyRateEditor
            key={row.id}
            row={row}
            saving={savingId === row.id}
            onSave={(draft) => onSave(row, draft)}
          />
        ))}
      </ul>
    </section>
  );
}

function PolicyRateEditor({
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
  const copy = MODEL_COPY[row.paymentModel];
  const Icon = copy.icon;
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
    <li
      className={`flex items-center gap-2.5 rounded-xl px-1.5 py-1.5 ${isActive ? '' : 'opacity-55'}`}
    >
      <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full">
        <Icon size={14} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-medium">{copy.title}</p>
        <p className="text-muted-foreground line-clamp-2 text-xs">{copy.hint}</p>
      </div>
      <PercentField label="Seller" value={sellerPercent} onChange={setSellerPercent} />
      <PercentField label="Assistant" value={assistantPercent} onChange={setAssistantPercent} />
      {dirty ? (
        <Button
          size="sm"
          disabled={saving || !isValidPercent(sellerPercent) || !isValidPercent(assistantPercent)}
          onClick={() => onSave({ sellerPercent, assistantPercent, isActive })}
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
      ) : null}
      <Switch
        checked={isActive}
        onCheckedChange={setIsActive}
        aria-label={`${copy.title} active`}
      />
    </li>
  );
}

function PercentField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="bg-muted/50 flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="flex items-center gap-1">
        <Input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={`${label} percent`}
          className="h-7 w-14 border-0 bg-transparent p-0 text-right text-sm font-semibold shadow-none focus-visible:ring-0"
        />
        <span className="text-muted-foreground text-xs">%</span>
      </span>
    </label>
  );
}

function isValidPercent(raw: string): boolean {
  const value = Number.parseFloat(raw.replace(',', '.'));
  return Number.isFinite(value) && value >= 0 && value <= 100;
}
