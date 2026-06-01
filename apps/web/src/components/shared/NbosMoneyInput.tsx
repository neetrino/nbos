'use client';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { MoneyInput, type MoneyInputProps } from './MoneyInput';

export type NbosMoneyInputProps = MoneyInputProps & {
  label?: string;
  labelClassName?: string;
  wrapperClassName?: string;
  helperText?: string;
  error?: string;
};

function slugifyLabel(label: string): string {
  return label
    .replace(/\s+/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
}

/** Labeled money field — drop-in replacement for `Label` + `MoneyInput`. */
export function NbosMoneyInput({
  label,
  labelClassName,
  wrapperClassName,
  helperText,
  error,
  id,
  className,
  'aria-invalid': ariaInvalid,
  ...inputProps
}: NbosMoneyInputProps) {
  const fieldId = id ?? (label ? `money-${slugifyLabel(label)}` : undefined);
  const hasError = Boolean(error);
  const errorId = fieldId ? `${fieldId}-error` : undefined;
  const helperId = fieldId ? `${fieldId}-helper` : undefined;
  const describedBy = error ? errorId : helperText ? helperId : undefined;

  const control = (
    <MoneyInput
      id={fieldId}
      className={className}
      aria-invalid={hasError || ariaInvalid ? true : undefined}
      aria-describedby={describedBy}
      {...inputProps}
    />
  );

  if (!label && !helperText && !error) {
    return control;
  }

  return (
    <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
      {label ? (
        <Label htmlFor={fieldId} className={labelClassName}>
          {label}
        </Label>
      ) : null}
      {control}
      {error ? (
        <p id={errorId} className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-muted-foreground text-xs">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
