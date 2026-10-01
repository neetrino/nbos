'use client';

import { Check, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { RelationPickerField } from '@/components/shared';
import type { RelationPickerSearchFn } from '@/components/shared/relation-picker';
import {
  DETAIL_SHEET_OUTLINED_LABEL_CLASS,
  DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { cn } from '@/lib/utils';

export type RegistrationRelation = {
  mode: 'create' | 'existing' | 'none';
  id: string;
  label: string;
};

export function ProductRegistrationRelation({
  kind,
  name,
  value,
  disabled,
  canCreate = true,
  onSearch,
  onChange,
}: {
  kind: 'project' | 'company';
  name: string;
  value: RegistrationRelation;
  disabled: boolean;
  canCreate?: boolean;
  onSearch: RelationPickerSearchFn;
  onChange: (value: RegistrationRelation) => void;
}) {
  const t = useTranslations('forms.product.registration');
  const creating = value.mode === 'create';
  return (
    <div className={DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS}>
      <span className={DETAIL_SHEET_OUTLINED_LABEL_CLASS}>{t(kind)}</span>
      <div className="border-border bg-card grid grid-cols-1 items-center gap-3 rounded-xl border p-3 sm:grid-cols-[minmax(0,3fr)_minmax(0,7fr)]">
        <button
          type="button"
          aria-pressed={creating}
          disabled={disabled || !canCreate}
          onClick={() => onChange({ mode: 'create', id: '', label: '' })}
          className={cn(
            'flex min-h-16 min-w-0 items-center gap-2 rounded-lg border px-3 py-3 text-left text-sm transition-colors disabled:opacity-50',
            creating ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted',
          )}
        >
          {creating ? <Check className="size-4 shrink-0" /> : <Plus className="size-4 shrink-0" />}
          <span className="min-w-0">
            <span className="block font-medium">{t('create')}</span>
            <span className="block truncate" title={name}>
              {name || t('namePlaceholder')}
            </span>
          </span>
        </button>
        <RelationPickerField
          label=""
          entityKind={kind}
          disabled={disabled}
          className="pt-0"
          value={value.mode === 'existing' ? value.id : null}
          selectionLabel={value.label}
          placeholder={t(kind === 'project' ? 'searchProject' : 'searchCompany')}
          onSearch={onSearch}
          onSelect={(id, label) => onChange({ mode: 'existing', id, label })}
          onClear={() => onChange({ mode: 'none', id: '', label: '' })}
        />
      </div>
    </div>
  );
}
