'use client';

import {
  DETAIL_SHEET_OUTLINED_FIELD_SHELL_CLASS,
  DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
  DETAIL_SHEET_OUTLINED_LABEL_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface ExpensePlanAutoGenerateFieldProps {
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (next: boolean) => void;
}

/** Outlined Switch field — same shell pattern as Subscription Notification. */
export function ExpensePlanAutoGenerateField({
  checked,
  disabled = false,
  onCheckedChange,
}: ExpensePlanAutoGenerateFieldProps) {
  return (
    <div
      className={cn(
        DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
        disabled && 'pointer-events-none opacity-60',
      )}
    >
      <span className={DETAIL_SHEET_OUTLINED_LABEL_CLASS}>Auto-generate</span>
      <div className={cn(DETAIL_SHEET_OUTLINED_FIELD_SHELL_CLASS, 'gap-2 pr-1.5')}>
        <Switch
          size="lg"
          checked={checked}
          disabled={disabled}
          aria-label="Auto-generate expense cards"
          onCheckedChange={(value) => onCheckedChange(Boolean(value))}
        />
      </div>
    </div>
  );
}
