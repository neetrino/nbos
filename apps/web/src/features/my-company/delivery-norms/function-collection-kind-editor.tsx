'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { DataView, LoadingState } from '@/components/shared';
import {
  deliveryCatalogStructureApi,
  type FunctionCollectionDto,
} from '@/lib/api/delivery-catalog-structure';
import { LOADING_LIST_COUNT } from './delivery-norms.constants';
import { FunctionCollectionEditor } from './function-collection-editor';
import { FunctionCollectionsList } from './function-collections-list';
import { messageFromCaught } from './message-from-caught';
import { NormsLoadError } from './norms-load-error';
import { useFunctionCollections } from './use-catalog-structure-lists';

const NEW_COLLECTION_ID = 'new';
const EMPTY_DRAFT = { name: '', functionIds: [] as string[] };

export function FunctionCollectionKindEditor({
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
  const listState = useFunctionCollections(productType);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftOverride, setDraftOverride] = useState<typeof EMPTY_DRAFT | null>(null);
  const [saving, setSaving] = useState(false);
  const resolvedId = resolveCollectionId(selectedId, listState.collections, canEdit);
  const selected = listState.collections.find((row) => row.id === resolvedId) ?? null;
  const draft = draftOverride ?? draftFromSelection(resolvedId, selected);

  return (
    <DataView
      loading={listState.loading}
      error={listState.error}
      hasData
      loadingFallback={<LoadingState variant="list" count={LOADING_LIST_COUNT} />}
      errorFallback={
        <NormsLoadError message={listState.error ?? ''} onRetry={() => void listState.load()} />
      }
    >
      <div className="space-y-4">
        <FunctionCollectionsList
          collections={listState.collections}
          selectedId={resolvedId}
          canCreate={canEdit}
          onSelect={(id) => {
            setSelectedId(id);
            setDraftOverride(null);
          }}
          onCreate={() => {
            setSelectedId(NEW_COLLECTION_ID);
            setDraftOverride(EMPTY_DRAFT);
          }}
        />
        {resolvedId ? (
          <FunctionCollectionEditor
            name={draft.name}
            selectedIds={draft.functionIds}
            options={catalog}
            disabled={!canEdit}
            saving={saving}
            onNameChange={(name) => setDraftOverride({ ...draft, name })}
            onChange={(functionIds) => setDraftOverride({ ...draft, functionIds })}
            onSave={() => {
              void submitCollection({
                productType,
                collectionId: resolvedId === NEW_COLLECTION_ID ? null : resolvedId,
                name: draft.name,
                functionIds: draft.functionIds,
                fallback: t('errors.collections'),
                onError,
                onSaved: (saved) => {
                  void listState.load();
                  setSelectedId(saved.id);
                  setDraftOverride(null);
                },
                setSaving,
              });
            }}
          />
        ) : (
          <p className="text-muted-foreground text-sm">{t('collections.empty')}</p>
        )}
      </div>
    </DataView>
  );
}

function resolveCollectionId(
  selectedId: string | null,
  collections: readonly FunctionCollectionDto[],
  canEdit: boolean,
): string | null {
  if (selectedId === NEW_COLLECTION_ID) return NEW_COLLECTION_ID;
  if (selectedId && collections.some((row) => row.id === selectedId)) return selectedId;
  return collections[0]?.id ?? (canEdit ? NEW_COLLECTION_ID : null);
}

function draftFromSelection(
  resolvedId: string | null,
  selected: FunctionCollectionDto | null,
): typeof EMPTY_DRAFT {
  if (resolvedId === NEW_COLLECTION_ID || !selected) return EMPTY_DRAFT;
  return { name: selected.name, functionIds: selected.functionIds };
}

async function submitCollection(input: {
  productType: string;
  collectionId: string | null;
  name: string;
  functionIds: string[];
  fallback: string;
  onError: (message: string) => void;
  onSaved: (saved: FunctionCollectionDto) => void;
  setSaving: (value: boolean) => void;
}): Promise<void> {
  input.setSaving(true);
  try {
    const body = {
      productType: input.productType,
      name: input.name,
      functionIds: input.functionIds,
    };
    const saved =
      input.collectionId === null
        ? await deliveryCatalogStructureApi.createCollection(body)
        : await deliveryCatalogStructureApi.replaceCollection(input.collectionId, body);
    input.onSaved(saved);
  } catch (caught) {
    input.onError(messageFromCaught(caught, input.fallback));
  } finally {
    input.setSaving(false);
  }
}
