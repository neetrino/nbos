'use client';

import { useTranslations } from 'next-intl';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { Button } from '@/components/ui/button';
import type { SearchOption } from '@/components/shared';
import { DETAIL_SHEET_SECTION_TITLE_CLASS } from '@/components/shared/detail-sheet-classes';
import { INCLUDED_FUNCTIONS_LIST_CLASS } from './delivery-norms.constants';
import { DeliveryNormsSearchSelect } from './delivery-norms-search-select';
import {
  addableIncludedOptions,
  addIncludedFunctionId,
  removeIncludedFunctionId,
  selectedIncludedFunctions,
} from './included-function-selection';

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
  const selectedItems = selectedIncludedFunctions(options, selectedIds);
  const addOptions = addableIncludedOptions(options, selectedIds);
  if (options.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">{emptyLabel ?? t('includedFunctions.empty')}</p>
    );
  }
  return (
    <div className="space-y-3">
      <h4 className={DETAIL_SHEET_SECTION_TITLE_CLASS}>{title ?? t('includedFunctions.title')}</h4>
      <fieldset className="contents" disabled={disabled}>
        <p className="text-muted-foreground text-xs">{hint ?? t('includedFunctions.hint')}</p>
        <IncludedAddSearch
          options={addOptions}
          disabled={disabled}
          selectedIds={selectedIds}
          onChange={onChange}
        />
        <SelectedIncludedList
          items={selectedItems}
          disabled={disabled}
          selectedIds={selectedIds}
          onChange={onChange}
        />
      </fieldset>
    </div>
  );
}

function IncludedAddSearch({
  options,
  disabled,
  selectedIds,
  onChange,
}: {
  options: SearchOption[];
  disabled?: boolean;
  selectedIds: string[];
  onChange: (next: string[]) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  if (options.length === 0) {
    return null;
  }
  return (
    <DeliveryNormsSearchSelect
      label={t('includedFunctions.add')}
      value={null}
      placeholder={t('includedFunctions.addPlaceholder')}
      disabled={disabled}
      options={options}
      onChange={(value) => {
        if (value === null) {
          return;
        }
        onChange(addIncludedFunctionId(selectedIds, value));
      }}
    />
  );
}

function SelectedIncludedList({
  items,
  disabled,
  selectedIds,
  onChange,
}: {
  items: DeliveryFunctionOperationalDto[];
  disabled?: boolean;
  selectedIds: string[];
  onChange: (next: string[]) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('includedFunctions.noneSelected')}</p>;
  }
  return (
    <ul className={INCLUDED_FUNCTIONS_LIST_CLASS}>
      {items.map((item) => (
        <li key={item.id} className="flex items-start justify-between gap-3 py-1">
          <span className="min-w-0 flex-1 space-y-0.5">
            <span className="text-foreground block truncate text-sm font-medium">{item.title}</span>
            <span className="text-muted-foreground block truncate text-xs">{item.code}</span>
          </span>
          {disabled ? null : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(removeIncludedFunctionId(selectedIds, item.id))}
            >
              {t('includedFunctions.remove')}
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
