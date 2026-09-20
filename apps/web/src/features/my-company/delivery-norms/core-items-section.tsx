'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { DeliveryBaseProfileFinancialDto } from '@nbos/shared';
import { DataView, LoadingState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { deliveryCatalogStructureApi } from '@/lib/api/delivery-catalog-structure';
import { CoreItemCreateForm } from './core-item-create-form';
import {
  addCoreItemDraft,
  coreItemDraftsFromDto,
  toCoreItemInputs,
  type CoreItemDraft,
} from './core-item-draft';
import { CoreItemsList } from './core-items-list';
import { LOADING_LIST_COUNT, OPTIONAL_SELECT_NONE } from './delivery-norms.constants';
import { DeliveryNormsSectionCard } from './delivery-norms-section-card';
import { messageFromCaught } from './message-from-caught';
import { NormEnumSelect } from './norm-enum-select';
import { NormField } from './norm-field';
import { NormsLoadError } from './norms-load-error';
import { useCoreItems } from './use-catalog-structure-lists';

export function CoreItemsSection({
  rows,
  canEdit,
  onError,
}: {
  rows: DeliveryBaseProfileFinancialDto[];
  canEdit: boolean;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const [versionId, setVersionId] = useState(OPTIONAL_SELECT_NONE);
  const selectedId = versionId === OPTIONAL_SELECT_NONE ? null : versionId;
  const selected = rows.find((row) => row.id === selectedId) ?? null;
  const { items, loading, error, load } = useCoreItems(selectedId);
  const labels = versionOptionLabels(rows, t);

  return (
    <DeliveryNormsSectionCard title={t('coreItems.title')} description={t('coreItems.subtitle')}>
      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('coreItems.emptyVersions')}</p>
      ) : (
        <NormField label={t('coreItems.pickVersion')}>
          <NormEnumSelect
            id="core-items-version"
            value={versionId}
            options={[OPTIONAL_SELECT_NONE, ...rows.map((row) => row.id)]}
            labels={labels}
            onChange={setVersionId}
          />
        </NormField>
      )}
      {selected ? (
        <CoreItemsEditor
          versionId={selected.id}
          items={items}
          loading={loading}
          error={error}
          editable={canEdit && selected.status === 'DRAFT'}
          onReload={() => void load()}
          onError={onError}
        />
      ) : null}
    </DeliveryNormsSectionCard>
  );
}

function CoreItemsEditor({
  versionId,
  items,
  loading,
  error,
  editable,
  onReload,
  onError,
}: {
  versionId: string;
  items: ReturnType<typeof useCoreItems>['items'];
  loading: boolean;
  error: string | null;
  editable: boolean;
  onReload: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const [drafts, setDrafts] = useState<CoreItemDraft[]>(() => coreItemDraftsFromDto(items));
  const [seenItems, setSeenItems] = useState(items);
  const [saving, setSaving] = useState(false);
  if (items !== seenItems) {
    setSeenItems(items);
    setDrafts(coreItemDraftsFromDto(items));
  }

  return (
    <div className="space-y-4">
      <CoreItemsToolbar
        drafts={drafts}
        editable={editable}
        saving={saving}
        onDraftsChange={setDrafts}
        onError={onError}
      />
      <DataView
        loading={loading}
        error={error}
        hasData={drafts.length > 0}
        loadingFallback={<LoadingState variant="list" count={LOADING_LIST_COUNT} />}
        errorFallback={<NormsLoadError message={error ?? ''} onRetry={onReload} />}
        emptyFallback={<p className="text-muted-foreground text-sm">{t('coreItems.empty')}</p>}
      >
        <CoreItemsList drafts={drafts} disabled={!editable || saving} onChange={setDrafts} />
      </DataView>
      <CoreItemsSaveButton
        versionId={versionId}
        drafts={drafts}
        editable={editable}
        saving={saving}
        onError={onError}
        onSaved={onReload}
        setSaving={setSaving}
      />
    </div>
  );
}

function CoreItemsToolbar({
  drafts,
  editable,
  saving,
  onDraftsChange,
  onError,
}: {
  drafts: CoreItemDraft[];
  editable: boolean;
  saving: boolean;
  onDraftsChange: (next: CoreItemDraft[]) => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  if (!editable) {
    return <p className="text-muted-foreground text-xs">{t('coreItems.readOnly')}</p>;
  }
  return (
    <CoreItemCreateForm
      disabled={saving}
      onAdd={(label, note) =>
        addDraftRow(drafts, label, note, t('errors.coreItemLabel'), onError, onDraftsChange)
      }
    />
  );
}

function CoreItemsSaveButton({
  versionId,
  drafts,
  editable,
  saving,
  onError,
  onSaved,
  setSaving,
}: {
  versionId: string;
  drafts: CoreItemDraft[];
  editable: boolean;
  saving: boolean;
  onError: (message: string) => void;
  onSaved: () => void;
  setSaving: (value: boolean) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  if (!editable) {
    return null;
  }
  return (
    <div className="flex justify-end">
      <Button
        type="button"
        size="sm"
        disabled={saving}
        onClick={() => {
          void submitCoreItems({
            versionId,
            drafts,
            fallback: t('errors.coreItems'),
            blankLabel: t('errors.coreItemLabel'),
            onError,
            onSaved,
            setSaving,
          });
        }}
      >
        {saving ? t('coreItems.saving') : t('coreItems.save')}
      </Button>
    </div>
  );
}

function addDraftRow(
  drafts: CoreItemDraft[],
  label: string,
  note: string,
  blankLabel: string,
  onError: (message: string) => void,
  setDrafts: (next: CoreItemDraft[]) => void,
): boolean {
  const next = addCoreItemDraft(drafts, { key: crypto.randomUUID(), label, note });
  if (next === null) {
    onError(blankLabel);
    return false;
  }
  setDrafts(next);
  return true;
}

async function submitCoreItems(input: {
  versionId: string;
  drafts: CoreItemDraft[];
  fallback: string;
  blankLabel: string;
  onError: (message: string) => void;
  onSaved: () => void;
  setSaving: (value: boolean) => void;
}): Promise<void> {
  const parsed = toCoreItemInputs(input.drafts);
  if (parsed.error === 'blankLabel') {
    input.onError(input.blankLabel);
    return;
  }
  input.setSaving(true);
  try {
    await deliveryCatalogStructureApi.replaceCoreItems(input.versionId, parsed.items);
    input.onSaved();
  } catch (caught) {
    input.onError(messageFromCaught(caught, input.fallback));
  } finally {
    input.setSaving(false);
  }
}

function versionOptionLabels(
  rows: DeliveryBaseProfileFinancialDto[],
  t: ReturnType<typeof useTranslations<'hr.deliveryNorms'>>,
): Record<string, string> {
  return Object.fromEntries([
    [OPTIONAL_SELECT_NONE, t('coreItems.pickVersion')],
    ...rows.map((row) => [row.id, `${row.profileKey} · ${t('columns.version')} ${row.version}`]),
  ]) as Record<string, string>;
}
