'use client';

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Pin, PinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PayrollMatrixViewMode } from '@/lib/api/payroll-allocation-matrix';

export function PayrollAllocationMatrixToolbar(props: {
  viewMode: PayrollMatrixViewMode;
  disabled: boolean;
  activeRowId: string | null;
  activeColumnId: string | null;
  columnPinned: boolean;
  onMoveColumn: (direction: -1 | 1) => void;
  onMoveRow: (direction: -1 | 1) => void;
  onTogglePin: () => void;
}) {
  const {
    viewMode,
    disabled,
    activeRowId,
    activeColumnId,
    columnPinned,
    onMoveColumn,
    onMoveRow,
    onTogglePin,
  } = props;

  const columnLabel = viewMode === 'EMPLOYEE_MATRIX' ? 'order column' : 'employee column';
  const rowLabel = viewMode === 'EMPLOYEE_MATRIX' ? 'employee row' : 'order row';
  const pinUnitId = viewMode === 'EMPLOYEE_MATRIX' ? activeColumnId : activeRowId;

  if (!activeColumnId && !activeRowId) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {activeColumnId ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-xs">Column ({columnLabel})</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => onMoveColumn(-1)}
            aria-label="Move column left"
          >
            <ChevronLeft size={14} aria-hidden />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => onMoveColumn(1)}
            aria-label="Move column right"
          >
            <ChevronRight size={14} aria-hidden />
          </Button>
          {pinUnitId ? (
            <Button
              type="button"
              size="sm"
              variant={columnPinned ? 'default' : 'outline'}
              disabled={disabled}
              onClick={onTogglePin}
            >
              {columnPinned ? (
                <PinOff size={14} className="mr-1" aria-hidden />
              ) : (
                <Pin size={14} className="mr-1" aria-hidden />
              )}
              {columnPinned ? 'Unpin unit' : 'Pin unit'}
            </Button>
          ) : null}
        </div>
      ) : null}
      {activeRowId ? (
        <>
          <span className="text-muted-foreground text-xs">Row ({rowLabel})</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => onMoveRow(-1)}
            aria-label="Move row up"
          >
            <ChevronUp size={14} aria-hidden />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => onMoveRow(1)}
            aria-label="Move row down"
          >
            <ChevronDown size={14} aria-hidden />
          </Button>
          {viewMode === 'ORDER_MATRIX' && pinUnitId ? (
            <Button
              type="button"
              size="sm"
              variant={columnPinned ? 'default' : 'outline'}
              disabled={disabled}
              onClick={onTogglePin}
            >
              {columnPinned ? (
                <PinOff size={14} className="mr-1" aria-hidden />
              ) : (
                <Pin size={14} className="mr-1" aria-hidden />
              )}
              {columnPinned ? 'Unpin unit' : 'Pin unit'}
            </Button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
