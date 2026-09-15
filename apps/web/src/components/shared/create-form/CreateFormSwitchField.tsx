'use client';

import { Switch } from '@/components/ui/switch';
import {
  DETAIL_SHEET_OUTLINED_FIELD_SHELL_CLASS,
  DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
  DETAIL_SHEET_OUTLINED_LABEL_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { cn } from '@/lib/utils';

interface CreateFormSwitchFieldProps {
  label: string;
  checked: boolean;
  disabled?: boolean;
  className?: string;
  onCheckedChange: (checked: boolean) => void;
}

export function CreateFormSwitchField({
  label,
  checked,
  disabled = false,
  className,
  onCheckedChange,
}: CreateFormSwitchFieldProps) {
  return (
    <div
      className={cn(
        DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
        disabled && 'pointer-events-none opacity-60',
        className,
      )}
    >
      <span className={DETAIL_SHEET_OUTLINED_LABEL_CLASS}>{label}</span>
      <div className={cn(DETAIL_SHEET_OUTLINED_FIELD_SHELL_CLASS, 'pr-1.5')}>
        <Switch
          size="lg"
          checked={checked}
          disabled={disabled}
          aria-label={label}
          onCheckedChange={(next) => onCheckedChange(Boolean(next))}
        />
      </div>
    </div>
  );
}
