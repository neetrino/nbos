'use client';

import { useTranslations } from 'next-intl';
import type { DeliveryCoreItemFinancialDto, DeliveryFunctionOperationalDto } from '@nbos/shared';
import { DETAIL_SHEET_TAB_BODY_STRETCH_CLASS, DetailSheetSection } from '@/components/shared';
import { CoreItemsEditor } from './core-items-editor';
import { FunctionCollectionKindEditor } from './function-collection-kind-editor';
import { IncludedFunctionsPicker } from './included-functions-picker';
import { RoleUnitsEditor } from './role-units-editor';
import type { RoleUnitDraftRow } from './role-units-draft';

export function CoreCompositionTab({
  versionId,
  status,
  coreItems,
  canEdit,
  onError,
  onChanged,
}: {
  versionId: string | null;
  status: string;
  coreItems?: readonly DeliveryCoreItemFinancialDto[];
  canEdit: boolean;
  onError: (message: string) => void;
  onChanged: () => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  if (!versionId) {
    return <p className="text-muted-foreground text-sm">{t('coreItems.emptyVersions')}</p>;
  }
  return (
    <div className={`${DETAIL_SHEET_TAB_BODY_STRETCH_CLASS} gap-4`}>
      <DetailSheetSection title={t('coreItems.title')}>
        <CoreItemsEditor
          versionId={versionId}
          status={status}
          initialItems={coreItems}
          editable={canEdit && (status === 'DRAFT' || status === 'PUBLISHED')}
          onError={onError}
          onChanged={onChanged}
        />
      </DetailSheetSection>
    </div>
  );
}

export function CoreUnitsTab({
  roleUnits,
  disabled,
  onChange,
}: {
  roleUnits: RoleUnitDraftRow[];
  disabled: boolean;
  onChange: (rows: RoleUnitDraftRow[]) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <div className={`${DETAIL_SHEET_TAB_BODY_STRETCH_CLASS} gap-4`}>
      <DetailSheetSection title={t('roleUnits.title')}>
        <RoleUnitsEditor rows={roleUnits} disabled={disabled} onChange={onChange} />
      </DetailSheetSection>
    </div>
  );
}

export function CoreIncludedTab({
  catalog,
  selectedIds,
  disabled,
  onChange,
}: {
  catalog: DeliveryFunctionOperationalDto[];
  selectedIds: string[];
  disabled: boolean;
  onChange: (ids: string[]) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <div className={`${DETAIL_SHEET_TAB_BODY_STRETCH_CLASS} gap-4`}>
      <DetailSheetSection title={t('includedFunctions.title')}>
        <IncludedFunctionsPicker
          options={catalog}
          selectedIds={selectedIds}
          disabled={disabled}
          hideTitle
          onChange={onChange}
        />
      </DetailSheetSection>
    </div>
  );
}

export function CoreCollectionsTab({
  productType,
  catalog,
  canEdit,
  onError,
}: {
  productType: string;
  catalog: DeliveryFunctionOperationalDto[];
  canEdit: boolean;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <div className={`${DETAIL_SHEET_TAB_BODY_STRETCH_CLASS} gap-4`}>
      <DetailSheetSection title={t('collections.title')}>
        <FunctionCollectionKindEditor
          productType={productType}
          catalog={catalog}
          canEdit={canEdit}
          onError={onError}
        />
      </DetailSheetSection>
    </div>
  );
}
