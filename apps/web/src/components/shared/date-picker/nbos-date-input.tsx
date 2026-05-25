'use client';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { NbosDatePicker, type NbosDatePickerProps } from './nbos-date-picker';

export type NbosDateInputProps = NbosDatePickerProps & {
  label?: string;
  labelClassName?: string;
  wrapperClassName?: string;
};

/** Labeled date field — drop-in replacement for `Label` + `Input type="date"`. */
export function NbosDateInput({
  label,
  labelClassName,
  wrapperClassName,
  id,
  className,
  ...pickerProps
}: NbosDateInputProps) {
  const fieldId = id ?? (label ? `date-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

  if (!label) {
    return <NbosDatePicker id={fieldId} className={className} {...pickerProps} />;
  }

  return (
    <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
      <Label htmlFor={fieldId} className={labelClassName}>
        {label}
      </Label>
      <NbosDatePicker id={fieldId} className={className} {...pickerProps} />
    </div>
  );
}
