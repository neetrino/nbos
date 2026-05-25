'use client';

import { useState } from 'react';
import { ChevronDown, Languages, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  PRODUCT_LANGUAGE_OPTIONS,
  languageLabel,
  sortLanguageCodesForDisplay,
} from './delivery-product-language-options';

interface DeliveryItemLanguagesMultiselectProps {
  value: string[];
  onChange?: (next: string[]) => void;
  disabled?: boolean;
  readOnly?: boolean;
}

export function DeliveryItemLanguagesMultiselect({
  value,
  onChange,
  disabled = false,
  readOnly = false,
}: DeliveryItemLanguagesMultiselectProps) {
  const [open, setOpen] = useState(false);
  const selected = new Set(value.map((c) => c.trim().toLowerCase()).filter(Boolean));
  const ordered = sortLanguageCodesForDisplay(Array.from(selected));

  function toggle(code: string) {
    if (readOnly || disabled || !onChange) return;
    const next = new Set(selected);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    onChange(sortLanguageCodesForDisplay(Array.from(next)));
  }

  function removeChip(code: string, e: React.MouseEvent | React.KeyboardEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (readOnly || disabled || !onChange) return;
    const next = new Set(selected);
    next.delete(code);
    onChange(sortLanguageCodesForDisplay(Array.from(next)));
  }

  function chipRemoveKeyDown(code: string, e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      removeChip(code, e);
    }
  }

  if (readOnly) {
    return (
      <div>
        <p className="text-muted-foreground mb-1.5 text-[10px] font-semibold tracking-wider uppercase">
          Languages
        </p>
        <p className="text-muted-foreground text-xs">
          {ordered.length > 0
            ? ordered.map((c) => languageLabel(c)).join(', ')
            : 'Inherited from parent product — not set.'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-muted-foreground mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase">
        <Languages size={12} className="opacity-70" aria-hidden />
        Languages
      </p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          className={cn(
            'border-input bg-background hover:bg-accent/40 flex min-h-10 w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left text-sm transition-colors outline-none',
            'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            open && 'border-ring ring-ring/30 ring-2',
            disabled && 'pointer-events-none opacity-50',
          )}
        >
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
            {ordered.length === 0 ? (
              <span className="text-muted-foreground px-1 text-xs">Select…</span>
            ) : (
              ordered.map((code) => (
                <span
                  key={code}
                  className="bg-primary/12 text-primary border-primary/15 inline-flex max-w-full items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-xs font-medium"
                >
                  <span className="truncate">{languageLabel(code)}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    className="text-primary/70 hover:text-primary focus-visible:ring-ring/50 inline-flex shrink-0 cursor-pointer rounded p-0.5 outline-none focus-visible:ring-2"
                    aria-label={`Remove ${languageLabel(code)}`}
                    onClick={(e) => removeChip(code, e)}
                    onKeyDown={(e) => chipRemoveKeyDown(code, e)}
                  >
                    <X className="size-3" aria-hidden />
                  </span>
                </span>
              ))
            )}
          </span>
          <ChevronDown className="text-muted-foreground size-4 shrink-0 opacity-70" aria-hidden />
        </PopoverTrigger>
        <PopoverContent className="max-h-72 w-[min(20rem,calc(100vw-2rem))] p-2" align="start">
          <ul className="max-h-56 space-y-0.5 overflow-y-auto pr-0.5">
            {PRODUCT_LANGUAGE_OPTIONS.map((opt) => {
              const checked = selected.has(opt.value);
              return (
                <li key={opt.value}>
                  <label className="hover:bg-muted/60 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(opt.value)}
                      disabled={disabled}
                    />
                    <span>{opt.label}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
}
