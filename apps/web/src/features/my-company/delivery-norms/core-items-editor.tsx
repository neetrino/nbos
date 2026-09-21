'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
import { LOADING_LIST_COUNT } from './delivery-norms.constants';
import { messageFromCaught } from './message-from-caught';
import { NormsLoadError } from './norms-load-error';
import { useCoreItems } from './use-catalog-structure-lists';

export function CoreItemsEditor({
  versionId,
  editable,
  onError,
}: {
  versionId: string;
  editable: boolean;
  onError: (message: string) => void;
}) {
  const { items, loading, error, load } = useCoreItems(versionId);
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
      {editable ? (
        <CoreItemCreateForm
          disabled={saving}
          onAdd={(label, note) =>
            addDraftRow(drafts, label, note, t('errors.coreItemLabel'), onError, setDrafts)
          }
        />
      ) : (
        <p className="text-muted-foreground text-xs">{t('coreItems.readOnly')}</p>
      )}
      <DataView
        loading={loading}
        error={error}
        hasData={drafts.length > 0}
        loadingFallback={<LoadingState variant="list" count={LOADING_LIST_COUNT} />}
        errorFallback={<NormsLoadError message={error ?? ''} onRetry={() => void load()} />}
        emptyFallback={<p className="text-muted-foreground text-sm">{t('coreItems.empty')}</p>}
      >
        <CoreItemsList drafts={drafts} disabled={!editable || saving} onChange={setDrafts} />
      </DataView>
      {editable ? (
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
                onSaved: () => void load(),
                setSaving,
              });
            }}
          >
            {saving ? t('coreItems.saving') : t('coreItems.save')}
          </Button>
        </div>
      ) : null}
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
