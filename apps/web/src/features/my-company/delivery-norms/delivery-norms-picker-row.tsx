'use client';

import { cn } from '@/lib/utils';
import {
  SIZE_PRESET_LEVEL_ACTIVE_CLASS,
  SIZE_PRESET_LEVEL_CLASS,
} from './delivery-norms.constants';

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
        SIZE_PRESET_LEVEL_CLASS,
        active ? SIZE_PRESET_LEVEL_ACTIVE_CLASS : null,
        disabled ? 'cursor-not-allowed opacity-50' : null,
      )}
      onClick={onSelect}
    >
      <span className="text-foreground min-w-0 truncate font-medium">{title}</span>
      {subtitle ? <span className="text-muted-foreground shrink-0 text-xs">{subtitle}</span> : null}
    </button>
  );
}
