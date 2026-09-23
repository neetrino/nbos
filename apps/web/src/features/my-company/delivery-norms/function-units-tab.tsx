'use client';

import { useTranslations } from 'next-intl';
import { DETAIL_SHEET_TAB_BODY_STRETCH_CLASS, DetailSheetSection } from '@/components/shared';
import { deliveryNormsApi } from '@/lib/api/delivery-norms';
import { FunctionVolumeSelect } from './function-volume-select';
import type { LiveFunctionPrice } from './live-function-prices';
import { PublishDraftButton } from './publish-draft-button';
import { RoleUnitsEditor } from './role-units-editor';
import type { RoleUnitDraftRow } from './role-units-draft';

export function FunctionUnitsTab({
  tierOptions,
  tierId,
  roleUnits,
  selected,
  canPublish,
  disabled,
  onTierChange,
  onRoleUnits,
  onChanged,
  onError,
}: {
  tierOptions: Array<{ value: string; label: string }>;
  tierId: string;
  roleUnits: RoleUnitDraftRow[];
  selected: LiveFunctionPrice | null;
  canPublish: boolean;
  disabled: boolean;
  onTierChange: (value: string) => void;
  onRoleUnits: (rows: RoleUnitDraftRow[]) => void;
  onChanged: () => void;
  onError: (message: string) => void;
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
          {selected?.draft && canPublish ? (
            <PublishDraftButton
              roleUnits={selected.draft.roleUnits}
              onPublish={async (confirmZeroUnits) => {
                await deliveryNormsApi.publishFunctionPrice(selected.draft?.id ?? '', {
                  confirmZeroUnits,
                });
              }}
              onError={onError}
              onPublished={onChanged}
            />
          ) : null}
        </div>
      </DetailSheetSection>
    </div>
  );
}
