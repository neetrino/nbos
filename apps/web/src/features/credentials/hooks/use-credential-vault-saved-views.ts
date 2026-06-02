'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { toast } from 'sonner';
import type {
  CredentialVaultSavedView,
  CredentialVaultSavedViewSnapshot,
} from '@/features/credentials/constants/credential-vault-saved-view.types';
import {
  CREDENTIAL_VAULT_SAVED_VIEWS_CHANGE,
  CREDENTIAL_VAULT_SAVED_VIEWS_MAX,
  readCredentialVaultSavedViews,
  writeCredentialVaultSavedViews,
} from '@/features/credentials/constants/credential-vault-saved-views-storage';

function subscribeSavedViews(onStoreChange: () => void): () => void {
  const onChange = () => onStoreChange();
  window.addEventListener('storage', onChange);
  window.addEventListener(CREDENTIAL_VAULT_SAVED_VIEWS_CHANGE, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CREDENTIAL_VAULT_SAVED_VIEWS_CHANGE, onChange);
  };
}

function getSavedViewsSnapshot(): CredentialVaultSavedView[] {
  return readCredentialVaultSavedViews();
}

function getSavedViewsServerSnapshot(): CredentialVaultSavedView[] {
  return [];
}

function snapshotToView(
  name: string,
  snapshot: CredentialVaultSavedViewSnapshot,
): CredentialVaultSavedView {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
    activeTab: snapshot.activeTab,
    vaultListScope: snapshot.vaultListScope,
    viewMode: snapshot.viewMode,
    search: snapshot.search,
    filters: { ...snapshot.filters },
    quickCategory: snapshot.quickCategory,
    quickFilters: [...snapshot.quickFilters],
  };
}

export function useCredentialVaultSavedViews(
  applySnapshot: (view: CredentialVaultSavedView) => void,
) {
  const views = useSyncExternalStore(
    subscribeSavedViews,
    getSavedViewsSnapshot,
    getSavedViewsServerSnapshot,
  );

  const saveView = useCallback((name: string, snapshot: CredentialVaultSavedViewSnapshot) => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Enter a name for the saved view');
      return;
    }
    const existing = readCredentialVaultSavedViews();
    const withoutDuplicate = existing.filter(
      (view) => view.name.toLowerCase() !== trimmed.toLowerCase(),
    );
    const next = [snapshotToView(trimmed, snapshot), ...withoutDuplicate].slice(
      0,
      CREDENTIAL_VAULT_SAVED_VIEWS_MAX,
    );
    writeCredentialVaultSavedViews(next);
    toast.success(`Saved view “${trimmed}”`);
  }, []);

  const applyView = useCallback(
    (viewId: string) => {
      const view = readCredentialVaultSavedViews().find((item) => item.id === viewId);
      if (!view) {
        toast.error('Saved view not found');
        return;
      }
      applySnapshot(view);
      toast.success(`Applied “${view.name}”`);
    },
    [applySnapshot],
  );

  const removeView = useCallback((viewId: string) => {
    const next = readCredentialVaultSavedViews().filter((item) => item.id !== viewId);
    writeCredentialVaultSavedViews(next);
    toast.success('Saved view removed');
  }, []);

  return { views, saveView, applyView, removeView };
}
