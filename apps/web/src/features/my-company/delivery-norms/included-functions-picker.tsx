'use client';

import { useTranslations } from 'next-intl';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { Checkbox } from '@/components/ui/checkbox';
import { INCLUDED_FUNCTIONS_LIST_CLASS } from './delivery-norms.constants';

export function IncludedFunctionsPicker({
  options,
  selectedIds,
  disabled,
  onChange,
}: {
  options: DeliveryFunctionOperationalDto[];
  selectedIds: string[];
  disabled?: boolean;
  onChange: (next: string[]) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const selected = new Set(selectedIds);
  if (options.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('includedFunctions.empty')}</p>;
  }
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="text-foreground text-sm font-semibold">
        {t('includedFunctions.title')}
      </legend>
      <p className="text-muted-foreground text-xs">{t('includedFunctions.hint')}</p>
      <ul className={INCLUDED_FUNCTIONS_LIST_CLASS}>
        {options.map((item) => (
          <li key={item.id}>
            <label className="hover:bg-muted/60 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm">
              <Checkbox
                checked={selected.has(item.id)}
                disabled={disabled}
                onCheckedChange={() => onChange(toggleId(selectedIds, item.id))}
              />
              <span className="text-foreground">{item.title}</span>
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
