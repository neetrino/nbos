'use client';

import { useTranslations } from 'next-intl';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IncludedFunctionsPicker } from './included-functions-picker';

export function FunctionCollectionEditor({
  name,
  selectedIds,
  options,
  disabled,
  saving,
  onNameChange,
  onChange,
  onSave,
}: {
  name: string;
  selectedIds: string[];
  options: DeliveryFunctionOperationalDto[];
  disabled: boolean;
  saving: boolean;
  onNameChange: (name: string) => void;
  onChange: (next: string[]) => void;
  onSave: () => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const locked = disabled || saving;
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="collection-name">{t('collections.name')}</Label>
        <Input
          id="collection-name"
          value={name}
          disabled={locked}
          onChange={(event) => onNameChange(event.target.value)}
        />
      </div>
      <IncludedFunctionsPicker
        options={options}
        selectedIds={selectedIds}
        disabled={locked}
        title={t('collections.pickerTitle')}
        hint={t('collections.pickerHint')}
        emptyLabel={t('collections.emptyFunctions')}
        onChange={onChange}
      />
      {disabled ? null : (
        <div className="flex justify-end">
          <Button type="button" size="sm" disabled={locked || name.trim() === ''} onClick={onSave}>
            {saving ? t('collections.saving') : t('collections.save')}
          </Button>
        </div>
      )}
    </div>
  );
}
