'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

  const addRow = () => {
    onChange([...bands, { minAttainmentPct: '0', payoutPercent: '0' }]);
  };

  const removeRow = (index: number) => {
    if (bands.length <= 1) {
      return;
    }
    onChange(bands.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Min attainment %</TableHead>
            <TableHead>Payout %</TableHead>
            <TableHead className="w-[4rem]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {bands.map((row, index) => (
            <TableRow key={`band-${index}`}>
              <TableCell>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={row.minAttainmentPct}
                  disabled={disabled}
                  onChange={(e) => updateRow(index, { minAttainmentPct: e.target.value })}
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={row.payoutPercent}
                  disabled={disabled}
                  onChange={(e) => updateRow(index, { payoutPercent: e.target.value })}
                />
              </TableCell>
              <TableCell>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled || bands.length <= 1}
                  onClick={() => removeRow(index)}
                >
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={addRow}>
        Add band
      </Button>
      <p className="text-muted-foreground text-xs leading-snug">
        Evaluated top-down: first band where plan attainment % is ≥ min applies. Used at payroll
        attach for SALES bonuses when this policy is on the employee compensation profile.
      </p>
    </div>
  );
}
