'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { DeliveryRoleUnitFinancialDto } from '@nbos/shared';
import { DataView, LoadingState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  deliveryCatalogStructureApi,
  type CoreItemDto,
} from '@/lib/api/delivery-catalog-structure';
import { deliveryNormsApi } from '@/lib/api/delivery-norms';
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
import { PublishDraftButton } from './publish-draft-button';
import { useCoreItems } from './use-catalog-structure-lists';

export function CoreItemsEditor({
  versionId,
  status,
  roleUnits,
  initialItems,
  editable,
  onError,
  onChanged,
}: {
  versionId: string;
  status: string;
  roleUnits: DeliveryRoleUnitFinancialDto[];
  initialItems?: readonly CoreItemDto[];
  editable: boolean;
  onError: (message: string) => void;
  onChanged: () => void;
}) {
  const editor = useCoreItemDrafts(versionId, initialItems);
  return (
    <div className="space-y-4">
      <CoreItemsNotice editable={editable} status={status} />
      <CoreItemsForm editor={editor} editable={editable} onError={onError} />
      {editable ? (
        <CoreItemsSaveBar
          versionId={versionId}
          status={status}
          roleUnits={roleUnits}
          editor={editor}
          onError={onError}
          onChanged={onChanged}
        />
      ) : null}
    </div>
  );
}

function CoreItemsForm({
  editor,
  editable,
  onError,
}: {
  editor: CoreItemEditorState;
  editable: boolean;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <>
      {editable ? (
        <CoreItemCreateForm
          disabled={editor.saving}
          onAdd={(label, note) =>
            addDraftRow(
              editor.drafts,
              label,
              note,
              t('errors.coreItemLabel'),
              onError,
              editor.setDrafts,
            )
          }
        />
      ) : null}
      <CoreItemsLoaded
        loading={editor.loading}
        error={editor.error}
        drafts={editor.drafts}
        editable={editable}
        saving={editor.saving}
        onRetry={() => void editor.load()}
        onChange={editor.setDrafts}
      />
    </>
  );
}

function CoreItemsSaveBar({
  versionId,
  status,
  roleUnits,
  editor,
  onError,
  onChanged,
}: {
  versionId: string;
  status: string;
  roleUnits: DeliveryRoleUnitFinancialDto[];
  editor: CoreItemEditorState;
  onError: (message: string) => void;
  onChanged: () => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <CoreItemsActions
      versionId={versionId}
      status={status}
      roleUnits={roleUnits}
      saving={editor.saving}
      saveLabel={editor.saving ? t('coreItems.saving') : t('coreItems.save')}
      onSave={() => {
        void submitCoreItems({
          versionId,
          drafts: editor.drafts,
          fallback: t('errors.coreItems'),
          blankLabel: t('errors.coreItemLabel'),
          onError,
          onSaved: () => void editor.load(),
          onChanged,
          setSaving: editor.setSaving,
        });
      }}
      onError={onError}
      onChanged={onChanged}
    />
  );
}

type CoreItemEditorState = ReturnType<typeof useCoreItemDrafts>;

function useCoreItemDrafts(versionId: string, initialItems?: readonly CoreItemDto[]) {
  const { items, loading, error, load } = useCoreItems(versionId, initialItems);
  const [drafts, setDrafts] = useState<CoreItemDraft[]>(() => coreItemDraftsFromDto(items));
  const [seenItems, setSeenItems] = useState(items);
  const [saving, setSaving] = useState(false);
  if (items !== seenItems) {
    setSeenItems(items);
    setDrafts(coreItemDraftsFromDto(items));
  }
  return { drafts, setDrafts, loading, error, load, saving, setSaving };
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
  onChanged: () => void;
  setSaving: (value: boolean) => void;
}): Promise<void> {
  const parsed = toCoreItemInputs(input.drafts);
  if (parsed.error === 'blankLabel') {
    input.onError(input.blankLabel);
    return;
  }
  input.setSaving(true);
  try {
    const saved = await deliveryCatalogStructureApi.replaceCoreItems(input.versionId, parsed.items);
    if (saved.profileVersionId !== input.versionId) {
      input.onChanged();
      return;
    }
    input.onSaved();
  } catch (caught) {
    input.onError(messageFromCaught(caught, input.fallback));
  } finally {
    input.setSaving(false);
  }
}

function CoreItemsNotice({ editable, status }: { editable: boolean; status: string }) {
  const t = useTranslations('hr.deliveryNorms');
  if (!editable) {
    return <p className="text-muted-foreground text-xs">{t('coreItems.readOnly')}</p>;
  }
  if (status === 'PUBLISHED') {
    return <p className="text-muted-foreground text-xs">{t('coreItems.revisePublished')}</p>;
  }
  return null;
}

function CoreItemsLoaded({
  loading,
  error,
  drafts,
  editable,
  saving,
  onRetry,
  onChange,
}: {
  loading: boolean;
  error: string | null;
  drafts: CoreItemDraft[];
  editable: boolean;
  saving: boolean;
  onRetry: () => void;
  onChange: (next: CoreItemDraft[]) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <DataView
      loading={loading}
      error={error}
      hasData={drafts.length > 0}
      loadingFallback={<LoadingState variant="list" count={LOADING_LIST_COUNT} />}
      errorFallback={<NormsLoadError message={error ?? ''} onRetry={onRetry} />}
      emptyFallback={<p className="text-muted-foreground text-sm">{t('coreItems.empty')}</p>}
    >
      <CoreItemsList drafts={drafts} disabled={!editable || saving} onChange={onChange} />
    </DataView>
  );
}

function CoreItemsActions({
  versionId,
  status,
  roleUnits,
  saving,
  saveLabel,
  onSave,
  onError,
  onChanged,
}: {
  versionId: string;
  status: string;
  roleUnits: DeliveryRoleUnitFinancialDto[];
  saving: boolean;
  saveLabel: string;
  onSave: () => void;
  onError: (message: string) => void;
  onChanged: () => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      {status === 'DRAFT' ? (
        <PublishDraftButton
          disabled={saving}
          roleUnits={roleUnits}
          onPublish={async (confirmZeroUnits) => {
            await deliveryNormsApi.publishBaseProfile(versionId, { confirmZeroUnits });
          }}
          onError={onError}
          onPublished={onChanged}
        />
      ) : null}
      <Button type="button" size="sm" disabled={saving} onClick={onSave}>
        {saveLabel}
      </Button>
    </div>
  );
}
