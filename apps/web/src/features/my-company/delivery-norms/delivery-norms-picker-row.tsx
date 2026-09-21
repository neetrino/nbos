'use client';

import { cn } from '@/lib/utils';
import { PICKER_CHIP_ACTIVE_CLASS, PICKER_CHIP_CLASS } from './delivery-norms.constants';

export function DeliveryNormsPickerRow({
  title,
  subtitle,
  active,
  disabled,
  onSelect,
}: {
  title: string;
  subtitle?: string;
  active: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        PICKER_CHIP_CLASS,
        active ? PICKER_CHIP_ACTIVE_CLASS : null,
        disabled ? 'cursor-not-allowed opacity-50' : null,
      )}
      onClick={onSelect}
    >
      <span className="text-foreground min-w-0 truncate font-medium">{title}</span>
      {subtitle ? <span className="text-muted-foreground shrink-0 text-xs">{subtitle}</span> : null}
    </button>
  );
}
