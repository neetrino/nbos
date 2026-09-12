'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { NBOS_DATE_PICKER_COMPACT_WIDTH_PX } from './date-picker-constants';
import { resolveDatePickerLocale } from './date-picker-locale';
import { formatIsoMonthValue, parseIsoMonthValue } from './date-picker-format';
import { formatMonthYearHeader } from './date-picker-presets';
import { monthDateFromParts, NbosMonthPickerGrid } from './nbos-month-picker-grid';
import { NbosDatePickerTrigger } from './nbos-date-picker-trigger';

export interface NbosMonthPickerProps {
  value: string;
  onChange: (value: string) => void;
  locale?: string;
  disabled?: boolean;
  clearable?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  'aria-label'?: string;
}

export function NbosMonthPicker({
  value,
  onChange,
  locale: localeProp,
  disabled = false,
  clearable = false,
  placeholder: placeholderProp,
  className,
  id,
  'aria-label': ariaLabel,
}: NbosMonthPickerProps) {
  const interfaceLocale = useLocale();
  const locale = resolveDatePickerLocale(interfaceLocale, localeProp);
  const t = useTranslations('forms');
  const placeholder = placeholderProp ?? t('datePicker.selectMonth');
  const parsed = useMemo(() => parseIsoMonthValue(value), [value]);
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => parsed?.getFullYear() ?? new Date().getFullYear());

  const displayText = parsed ? formatMonthYearHeader(parsed, locale) : '';

  const handleSelectMonth = (monthIndex: number) => {
    onChange(formatIsoMonthValue(monthDateFromParts(viewYear, monthIndex)));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn('w-full min-w-0 border-0 bg-transparent p-0 shadow-none', className)}
      >
        <NbosDatePickerTrigger
          id={id}
          aria-label={ariaLabel}
          displayValue={displayText}
          placeholder={placeholder}
          disabled={disabled}
          clearable={clearable}
          hasValue={Boolean(parsed)}
          onClear={clearable ? () => onChange('') : undefined}
        />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="rounded-2xl p-4"
        style={{ width: NBOS_DATE_PICKER_COMPACT_WIDTH_PX, maxWidth: 'min(100vw - 2rem, 100%)' }}
      >
        <NbosMonthPickerGrid
          viewYear={viewYear}
          selectedMonth={parsed}
          locale={locale}
          onViewYearChange={setViewYear}
          onSelectMonth={handleSelectMonth}
          previousYearLabel={t('datePicker.previousYear')}
          nextYearLabel={t('datePicker.nextYear')}
        />
        <div className="border-border/50 mt-3 flex justify-between border-t pt-2">
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-primary text-sm font-medium"
          >
            {t('datePicker.clear')}
          </button>
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              setViewYear(now.getFullYear());
              onChange(formatIsoMonthValue(now));
              setOpen(false);
            }}
            className="text-primary text-sm font-medium"
          >
            {t('datePicker.thisMonth')}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
