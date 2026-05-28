'use client';

import { ChevronLeft, ChevronRight, Pin, PinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PayrollAllocationMatrixToolbar(props: {
  disabled: boolean;
  activeColumnId: string | null;
  pinned: boolean;
  onMoveColumn: (direction: -1 | 1) => void;
  onTogglePin: () => void;
}) {
  const { disabled, activeColumnId, pinned, onMoveColumn, onTogglePin } = props;

  if (!activeColumnId) {
    return (
      <p className="text-muted-foreground text-xs">
        Select a column header to reorder or pin a delivery unit.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
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
      <Button
        type="button"
        size="sm"
        variant={pinned ? 'default' : 'outline'}
        disabled={disabled}
        onClick={onTogglePin}
      >
        {pinned ? (
          <PinOff size={14} className="mr-1" aria-hidden />
        ) : (
          <Pin size={14} className="mr-1" aria-hidden />
        )}
        {pinned ? 'Unpin unit' : 'Pin unit'}
      </Button>
    </div>
  );
}
