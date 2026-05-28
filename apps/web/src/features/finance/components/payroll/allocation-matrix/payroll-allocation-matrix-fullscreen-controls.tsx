'use client';

import { Minimize2 } from 'lucide-react';
import { ViewModeSwitch } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { PAYROLL_ALLOCATION_MATRIX_VIEW_OPTIONS } from '@/features/finance/components/payroll/allocation-matrix/payroll-allocation-matrix-view-options';
import type { PayrollMatrixViewMode } from '@/lib/api/payroll-allocation-matrix';

export function PayrollAllocationMatrixFullscreenControls({
  viewMode,
  onViewModeChange,
  onExit,
}: {
  viewMode: PayrollMatrixViewMode;
  onViewModeChange: (mode: PayrollMatrixViewMode) => void;
  onExit: () => void;
}) {
  return (
    <div className="border-border bg-card flex items-center gap-2 rounded-lg border p-1.5 shadow-md">
      <ViewModeSwitch
        value={viewMode}
        onChange={onViewModeChange}
        options={PAYROLL_ALLOCATION_MATRIX_VIEW_OPTIONS}
        ariaLabel="Allocation matrix view"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-8 shrink-0"
        aria-label="Exit full screen"
        onClick={onExit}
      >
        <Minimize2 className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
