'use client';

import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PRODUCT_LANGUAGE_OPTIONS,
  sortLanguageCodesForDisplay,
} from './delivery-product-language-options';

interface DeliveryItemLanguagesPanelProps {
  value: string[];
  onChange?: (next: string[]) => void;
  disabled?: boolean;
  readOnly?: boolean;
}

export function DeliveryItemLanguagesPanel({
  value,
  onChange,
  disabled = false,
  readOnly = false,
}: DeliveryItemLanguagesPanelProps) {
  const selected = new Set(value);
  const orderedSelected = sortLanguageCodesForDisplay(value);

  function toggle(code: string) {
    if (readOnly || disabled || !onChange) return;
    const next = new Set(selected);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    onChange(sortLanguageCodesForDisplay(Array.from(next)));
  }

  return (
    <div>
      <h4 className="text-muted-foreground mb-2 flex items-center gap-2 text-[10px] font-semibold tracking-wider uppercase">
        <Languages size={12} className="opacity-70" aria-hidden />
        Languages
      </h4>
      {readOnly ? (
        <p className="text-muted-foreground text-xs">
          {orderedSelected.length > 0
            ? orderedSelected.map((c) => c.toUpperCase()).join(', ')
            : 'Inherited from parent product — not set.'}
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {PRODUCT_LANGUAGE_OPTIONS.map((opt) => {
            const active = selected.has(opt.value);
            return (
              <Button
                key={opt.value}
                type="button"
                size="sm"
                variant={active ? 'default' : 'outline'}
                className="h-8 text-xs"
                disabled={disabled}
                onClick={() => toggle(opt.value)}
              >
                {opt.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface DeliveryItemPaymentSummaryProps {
  paymentType: string | null | undefined;
}

export function DeliveryItemPaymentSummary({ paymentType }: DeliveryItemPaymentSummaryProps) {
  const label = paymentType?.replace(/_/g, ' ') ?? '—';
  return (
    <div>
      <h4 className="text-muted-foreground mb-1 text-[10px] font-semibold tracking-wider uppercase">
        Payment
      </h4>
      <p className="text-foreground text-sm font-medium">{label}</p>
      <p className="text-muted-foreground text-xs">From order · read only</p>
    </div>
  );
}
