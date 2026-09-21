'use client';

import { useTranslations } from 'next-intl';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { Button } from '@/components/ui/button';
import { IncludedFunctionsPicker } from './included-functions-picker';

export function SizePresetCreateForm({
  options,
  selectedIds,
  disabled,
  saving,
  onChange,
  onSave,
}: {
  options: DeliveryFunctionOperationalDto[];
  selectedIds: string[];
  disabled: boolean;
  saving: boolean;
  onChange: (next: string[]) => void;
  onSave: () => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const locked = disabled || saving;
  return (
    <div className="space-y-3">
      <IncludedFunctionsPicker
        options={options}
        selectedIds={selectedIds}
        disabled={locked}
        title={t('sizePresets.pickerTitle')}
        hint={t('sizePresets.pickerHint')}
        emptyLabel={t('sizePresets.emptyFunctions')}
        onChange={onChange}
      />
      {disabled ? null : (
        <div className="flex justify-end">
          <Button type="button" size="sm" disabled={locked} onClick={onSave}>
            {saving ? t('sizePresets.saving') : t('sizePresets.save')}
          </Button>
        </div>
      )}
    </div>
  );
}
