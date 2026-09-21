'use client';

import { useTranslations } from 'next-intl';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { Checkbox } from '@/components/ui/checkbox';
import { DETAIL_SHEET_SUBSECTION_LABEL_CLASS } from '@/components/shared/detail-sheet-classes';
import { cn } from '@/lib/utils';
import {
  CHECKBOX_ROW_ACTIVE_CLASS,
  CHECKBOX_ROW_CLASS,
  INCLUDED_FUNCTIONS_LIST_CLASS,
} from './delivery-norms.constants';

export function IncludedFunctionsPicker({
  options,
  selectedIds,
  disabled,
  title,
  hint,
  emptyLabel,
  onChange,
}: {
  options: DeliveryFunctionOperationalDto[];
  selectedIds: string[];
  disabled?: boolean;
  title?: string;
  hint?: string;
  emptyLabel?: string;
  onChange: (next: string[]) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const selected = new Set(selectedIds);
  if (options.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">{emptyLabel ?? t('includedFunctions.empty')}</p>
    );
  }
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className={DETAIL_SHEET_SUBSECTION_LABEL_CLASS}>
        {title ?? t('includedFunctions.title')}
      </legend>
      <p className="text-muted-foreground text-xs">{hint ?? t('includedFunctions.hint')}</p>
      <ul className={INCLUDED_FUNCTIONS_LIST_CLASS}>
        {options.map((item) => (
          <li key={item.id}>
            <label
              className={cn(
                CHECKBOX_ROW_CLASS,
                selected.has(item.id) ? CHECKBOX_ROW_ACTIVE_CLASS : null,
              )}
            >
              <Checkbox
                checked={selected.has(item.id)}
                disabled={disabled}
                onCheckedChange={() => onChange(toggleId(selectedIds, item.id))}
              />
              <span className="text-foreground min-w-0 flex-1 font-medium">{item.title}</span>
              <span className="text-muted-foreground text-xs">{item.code}</span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

function toggleId(ids: readonly string[], id: string): string[] {
  if (ids.includes(id)) {
    return ids.filter((item) => item !== id);
  }
  return [...ids, id];
}
