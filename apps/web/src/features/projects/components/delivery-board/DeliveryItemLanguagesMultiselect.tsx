'use client';

import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS,
  DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
  DETAIL_SHEET_OUTLINED_LABEL_CLASS,
  DETAIL_SHEET_OUTLINED_SHELL_BORDER_CLASS,
} from '@/components/shared/detail-sheet-classes';
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

const LANGUAGES_OUTLINED_SHELL_CLASS = cn(
  DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS,
  DETAIL_SHEET_OUTLINED_SHELL_BORDER_CLASS,
  'flex min-h-10 w-full min-w-0 items-center rounded-xl px-3 py-2 text-sm',
);

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
      <div className={DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS}>
        <span className={DETAIL_SHEET_OUTLINED_LABEL_CLASS}>Languages</span>
        <div className={LANGUAGES_OUTLINED_SHELL_CLASS}>
          <p className="text-muted-foreground text-xs">
            {ordered.length > 0
              ? ordered.map((c) => languageLabel(c)).join(', ')
              : 'Inherited from parent product — not set.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS}>
      <span className={DETAIL_SHEET_OUTLINED_LABEL_CLASS}>Languages</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          className={cn(
            LANGUAGES_OUTLINED_SHELL_CLASS,
            'justify-between gap-2 px-2.5 py-1.5 text-left outline-none',
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
        <PopoverContent
          align="end"
          className="max-h-72 w-(--anchor-width) min-w-(--anchor-width) p-2"
        >
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
