'use client';

import { forwardRef, useRef, type ChangeEvent, type ComponentProps } from 'react';
import { Input } from '@/components/ui/input';
import { formatMoneyInput, sanitizeMoneyInput } from '@/lib/format/money';
import { cn } from '@/lib/utils';

function countSignificantCharsBefore(value: string, cursor: number): number {
  let count = 0;
  for (let i = 0; i < cursor && i < value.length; i++) {
    const char = value[i];
    if (char && (/\d/.test(char) || char === '.' || char === '-')) {
      count++;
    }
  }
  return count;
}

function cursorFromSignificantIndex(value: string, index: number): number {
  if (index <= 0) {
    return 0;
  }

  let count = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (char && (/\d/.test(char) || char === '.' || char === '-')) {
      count++;
      if (count >= index) {
        return i + 1;
      }
    }
  }

  return value.length;
}

export type MoneyInputProps = Omit<
  ComponentProps<'input'>,
  'type' | 'value' | 'onChange' | 'inputMode'
> & {
  value: string | number | null | undefined;
  onChange: (value: string) => void;
};

/** Text input that groups thousands while typing (hy-AM locale). */
export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  { value, onChange, className, disabled, ...rest },
  forwardedRef,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const displayValue = formatMoneyInput(value);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const raw = input.value;
    const selectionStart = input.selectionStart ?? raw.length;
    const significantBefore = countSignificantCharsBefore(raw, selectionStart);
    const sanitized = sanitizeMoneyInput(raw);
    const formatted = formatMoneyInput(sanitized);

    onChange(sanitized);

    requestAnimationFrame(() => {
      const element = inputRef.current;
      if (!element) {
        return;
      }
      const nextPos = cursorFromSignificantIndex(formatted, significantBefore);
      element.setSelectionRange(nextPos, nextPos);
    });
  };

  const setRefs = (element: HTMLInputElement | null) => {
    inputRef.current = element;
    if (typeof forwardedRef === 'function') {
      forwardedRef(element);
      return;
    }
    if (forwardedRef) {
      forwardedRef.current = element;
    }
  };

  return (
    <Input
      ref={setRefs}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={displayValue}
      onChange={handleChange}
      disabled={disabled}
      className={cn(className)}
      {...rest}
    />
  );
});
