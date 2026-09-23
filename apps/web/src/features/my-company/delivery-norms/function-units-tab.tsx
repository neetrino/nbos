'use client';

import { useTranslations } from 'next-intl';
import { DETAIL_SHEET_TAB_BODY_STRETCH_CLASS, DetailSheetSection } from '@/components/shared';
import { FunctionVolumeSelect } from './function-volume-select';
import { RoleUnitsEditor } from './role-units-editor';
import type { RoleUnitDraftRow } from './role-units-draft';

export function FunctionUnitsTab({
  tierOptions,
  tierId,
  roleUnits,
  disabled,
  onTierChange,
  onRoleUnits,
}: {
  tierOptions: Array<{ value: string; label: string }>;
  tierId: string;
  roleUnits: RoleUnitDraftRow[];
  disabled: boolean;
  onTierChange: (value: string) => void;
  onRoleUnits: (rows: RoleUnitDraftRow[]) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <div className={`${DETAIL_SHEET_TAB_BODY_STRETCH_CLASS} gap-4`}>
      <DetailSheetSection title={t('roleUnits.title')}>
        <div className="space-y-4">
          <FunctionVolumeSelect
            options={tierOptions}
            value={tierId}
            disabled={disabled}
            onChange={onTierChange}
          />
          <RoleUnitsEditor rows={roleUnits} disabled={disabled} onChange={onRoleUnits} />
        </div>
      </DetailSheetSection>
    </div>
  );
}
