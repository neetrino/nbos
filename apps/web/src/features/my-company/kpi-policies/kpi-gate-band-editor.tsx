'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { KpiGateBandDraft } from './kpi-gate-band-utils';

export function KpiGateBandEditor({
  bands,
  onChange,
  disabled,
}: {
  bands: KpiGateBandDraft[];
  onChange: (next: KpiGateBandDraft[]) => void;
  disabled?: boolean;
}) {
  const updateRow = (index: number, patch: Partial<KpiGateBandDraft>) => {
    onChange(bands.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  return (
    <div className="space-y-2">
      <ul className="flex flex-col gap-1">
        {bands.map((row, index) => (
          <BandStep
            key={`band-${index}`}
            index={index}
            row={row}
            disabled={disabled}
            canRemove={bands.length > 1}
            onPatch={(patch) => updateRow(index, patch)}
            onRemove={() => onChange(bands.filter((_, i) => i !== index))}
          />
        ))}
      </ul>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => onChange([...bands, { minAttainmentPct: '0', payoutPercent: '0' }])}
      >
        <Plus size={14} />
        Add step
      </Button>
    </div>
  );
}

function BandStep({
  index,
  row,
  disabled,
  canRemove,
  onPatch,
  onRemove,
}: {
  index: number;
  row: KpiGateBandDraft;
  disabled?: boolean;
  canRemove: boolean;
  onPatch: (patch: Partial<KpiGateBandDraft>) => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex items-end gap-2 rounded-xl px-1 py-1.5">
      <span className="text-primary mb-2 w-6 shrink-0 text-xs font-semibold tabular-nums">
        {String(index + 1).padStart(2, '0')}
      </span>
      <PercentStepField
        label="Result at least"
        value={row.minAttainmentPct}
        disabled={disabled}
        onChange={(minAttainmentPct) => onPatch({ minAttainmentPct })}
      />
      <PercentStepField
        label="Bonus pays"
        value={row.payoutPercent}
        disabled={disabled}
        onChange={(payoutPercent) => onPatch({ payoutPercent })}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="mb-0.5 shrink-0"
        disabled={disabled || !canRemove}
        aria-label={`Remove step ${index + 1}`}
        onClick={onRemove}
      >
        <Trash2 size={14} />
      </Button>
    </li>
  );
}

function PercentStepField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="min-w-0 flex-1 space-y-1">
      <span className="text-muted-foreground block text-[11px] font-medium">{label}</span>
      <span className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          max={100}
          className="h-8"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
        <span className="text-muted-foreground text-xs">%</span>
      </span>
    </label>
  );
}
