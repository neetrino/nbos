'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CredentialFormFieldLabel } from '@/features/credentials/components/credential-form-field-label';
import { CredentialFormSelectOption } from '@/features/credentials/components/credential-form-select-option';
import type { CredentialCategoryOption } from '@/features/credentials/constants/credential-vault-categories';
import { credentialCategoryIcon } from '@/features/credentials/utils/credential-vault-card-meta';

export interface CredentialFormCategoryComboboxProps {
  category: string;
  categoryLabel: string;
  categoryOptions: readonly CredentialCategoryOption[];
  categoryLocked: boolean;
  invalid?: boolean;
  onCategoryChange: (value: string) => void;
}

export function CredentialFormCategoryCombobox({
  category,
  categoryLabel,
  categoryOptions,
  categoryLocked,
  invalid = false,
  onCategoryChange,
}: CredentialFormCategoryComboboxProps) {
  const t = useTranslations('credentials');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const CategoryIcon = credentialCategoryIcon(category || 'SERVICE');
  const selectedLabel = category
    ? (categoryOptions.find((option) => option.value === category)?.label ?? categoryLabel)
    : '';
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return categoryOptions;
    return categoryOptions.filter((option) => option.label.toLowerCase().includes(needle));
  }, [categoryOptions, query]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  return (
    <div className="grid gap-2" ref={containerRef}>
      <CredentialFormFieldLabel label={t('form.category')} icon={CategoryIcon} />
      <div className="relative">
        <Input
          ref={inputRef}
          data-credential-category-field
          value={open ? query : selectedLabel}
          disabled={categoryLocked}
          aria-invalid={invalid || undefined}
          aria-required
          aria-expanded={open}
          placeholder={t('form.selectCategory')}
          autoComplete="off"
          onFocus={() => {
            if (categoryLocked) return;
            setOpen(true);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          className="pr-9"
        />
        <ChevronDown
          className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 opacity-80"
          aria-hidden
        />
        {open && !categoryLocked ? (
          <ul
            className={cn(
              'border-border bg-popover absolute inset-x-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border p-1 shadow-lg',
            )}
          >
            {filtered.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  className="hover:bg-muted/60 flex w-full items-center rounded-lg px-2 py-1.5 text-left"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onCategoryChange(option.value);
                    setOpen(false);
                    setQuery('');
                  }}
                >
                  <CredentialFormSelectOption
                    kind="category"
                    value={option.value}
                    label={option.label}
                  />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
