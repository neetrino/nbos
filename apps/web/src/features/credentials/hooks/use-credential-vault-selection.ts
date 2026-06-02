'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CREDENTIAL_VAULT_BULK_MAX } from '@/features/credentials/constants/credential-vault-bulk';

export function useCredentialVaultSelection(
  enabled: boolean,
  pageCredentialIds: string[],
  resetKey: string,
) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelectedIds(new Set());
  }, [resetKey]);

  const selectedCount = selectedIds.size;
  const selectedIdList = useMemo(() => [...selectedIds], [selectedIds]);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return next;
      }
      if (next.size >= CREDENTIAL_VAULT_BULK_MAX) {
        toast.error(`You can select up to ${CREDENTIAL_VAULT_BULK_MAX} credentials`);
        return prev;
      }
      next.add(id);
      return next;
    });
  }, []);

  const selectAllOnPage = useCallback(() => {
    const slice = pageCredentialIds.slice(0, CREDENTIAL_VAULT_BULK_MAX);
    if (pageCredentialIds.length > CREDENTIAL_VAULT_BULK_MAX) {
      toast.message(`Selected first ${CREDENTIAL_VAULT_BULK_MAX} on this page`);
    }
    setSelectedIds(new Set(slice));
  }, [pageCredentialIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectionActive = enabled && selectedCount > 0;

  return {
    selectionEnabled: enabled,
    selectedIds,
    selectedCount,
    selectedIdList,
    isSelected,
    toggleSelected,
    selectAllOnPage,
    clearSelection,
    selectionActive,
  };
}
