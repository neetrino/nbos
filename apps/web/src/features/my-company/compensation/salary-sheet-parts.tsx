'use client';

import { useTranslations } from 'next-intl';
import { History, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatMoneyDram, parseMoneyAmount } from '@/lib/format/money';
import type { CompensationProfileRow } from '@/lib/api/compensation-profiles';

export interface SalaryFormSnapshot {
  baseSalary: string;
  effectiveFrom: string;
  bonusPolicyId: string;
  kpiPolicyId: string;
}

/** True when the sheet fields differ from the last loaded salary. */
export function isSalaryFormDirty(current: SalaryFormSnapshot, saved: SalaryFormSnapshot): boolean {
  return (
    parseMoneyAmount(current.baseSalary) !== parseMoneyAmount(saved.baseSalary) ||
    current.effectiveFrom !== saved.effectiveFrom ||
    current.bonusPolicyId !== saved.bonusPolicyId ||
    current.kpiPolicyId !== saved.kpiPolicyId
  );
}

export function salaryNote(
  active: CompensationProfileRow | null,
  nextSalary: string,
  label: (amount: string) => string,
): string | null {
  if (!active) return null;
  const next = Number.parseFloat(nextSalary);
  const current = Number.parseFloat(active.baseSalary);
  if (Number.isFinite(next) && next === current) return null;
  return label(formatMoneyDram(current));
}

export function bonusNote(
  active: CompensationProfileRow | null,
  nextBonusId: string,
  emptyName: string,
  label: (name: string) => string,
): string | null {
  if (!active || (nextBonusId || '') === (active.bonusPolicyId ?? '')) return null;
  return label(active.bonusPolicy?.name ?? emptyName);
}

export function kpiNote(
  active: CompensationProfileRow | null,
  nextKpiId: string,
  emptyName: string,
  label: (name: string) => string,
): string | null {
  if (!active || (nextKpiId || '') === (active.kpiPolicyId ?? '')) return null;
  return label(active.kpiPolicy?.name ?? emptyName);
}

export function replaceActivated(
  prev: CompensationProfileRow[],
  updated: CompensationProfileRow,
): CompensationProfileRow[] {
  const without = prev.filter((row) => row.id !== updated.id);
  return [
    updated,
    ...without.map((row) =>
      row.status === 'ACTIVE' ? { ...row, status: 'ARCHIVED' as const } : row,
    ),
  ];
}

export function salarySheetTabs(general: string, history: string) {
  return [
    { value: 'general', label: general, icon: LayoutGrid },
    { value: 'history', label: history, icon: History },
  ];
}

export function SalaryActivateConfirm({
  open,
  busy,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const t = useTranslations('hr.salaries');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('confirmTitle')}</DialogTitle>
          <DialogDescription>{t('confirmBody')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            {t('cancel')}
          </Button>
          <Button type="button" disabled={busy} onClick={onConfirm}>
            {t('confirmSave')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
