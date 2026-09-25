'use client';

import { useTranslations } from 'next-intl';
import { Layers, ListTree, Package, Puzzle } from 'lucide-react';
import type { DeliveryCoreItemFinancialDto, DeliveryFunctionOperationalDto } from '@nbos/shared';
import { DETAIL_SHEET_TAB_BODY_STRETCH_CLASS, InsightSheetSection } from '@/components/shared';
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
      <InsightSheetSection
        icon={<ListTree size={15} />}
        title={t('coreItems.title')}
        hint={t('coreItems.hint')}
      >
        <CoreItemsEditor
          versionId={versionId}
          status={status}
          initialItems={coreItems}
          editable={canEdit && (status === 'DRAFT' || status === 'PUBLISHED')}
          onError={onError}
          onChanged={onChanged}
        />
      </InsightSheetSection>
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
      <InsightSheetSection
        icon={<Layers size={15} />}
        title={t('roleUnits.title')}
        hint={t('cores.editHint')}
      >
        <RoleUnitsEditor rows={roleUnits} disabled={disabled} onChange={onChange} />
      </InsightSheetSection>
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
      <InsightSheetSection
        icon={<Puzzle size={15} />}
        title={t('includedFunctions.title')}
        hint={t('includedFunctions.hint')}
      >
        <IncludedFunctionsPicker
          options={catalog}
          selectedIds={selectedIds}
          disabled={disabled}
          hideTitle
          hideHint
          onChange={onChange}
        />
      </InsightSheetSection>
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
      <InsightSheetSection
        icon={<Package size={15} />}
        title={t('collections.title')}
        hint={t('collections.hint')}
      >
        <FunctionCollectionKindEditor
          productType={productType}
          catalog={catalog}
          canEdit={canEdit}
          onError={onError}
        />
      </InsightSheetSection>
    </div>
  );
}
