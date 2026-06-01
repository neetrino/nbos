'use client';

import {
  PAYROLL_RUN_STATUS_CALENDAR_CELL_CLASS,
  payrollRunStatusUi,
} from '@/features/finance/constants/payroll-run-status-ui';
import type { PayrollRunStatus } from '@/lib/api/payroll-runs';
import { cn } from '@/lib/utils';

const HERO_STATUS_FALLBACK_CLASS = PAYROLL_RUN_STATUS_CALENDAR_CELL_CLASS.DRAFT;

/** Prominent run status for payroll detail PageHero (replaces zone tabs). */
export function PayrollRunStatusHeroBadge({ status }: { status: PayrollRunStatus }) {
  const ui = payrollRunStatusUi(status);
  const toneClass = PAYROLL_RUN_STATUS_CALENDAR_CELL_CLASS[status] ?? HERO_STATUS_FALLBACK_CLASS;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border px-4 py-1.5 text-sm font-semibold tracking-wide shadow-sm',
        toneClass,
      )}
    >
      {ui.label}
    </span>
  );
}
