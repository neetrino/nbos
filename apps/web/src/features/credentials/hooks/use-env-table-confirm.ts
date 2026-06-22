'use client';

import { useCallback, useMemo, useState } from 'react';
import type { EnvBundleEntry } from '@nbos/shared';
import type { DeleteConfirmDialogProps } from '@/components/shared';
import {
  ENV_TABLE_CONFIRM_KEY_OVERWRITE_DESCRIPTION,
  ENV_TABLE_CONFIRM_KEY_OVERWRITE_TITLE,
  ENV_TABLE_CONFIRM_PASTE_MERGE_DESCRIPTION,
  ENV_TABLE_CONFIRM_PASTE_MERGE_TITLE,
  ENV_TABLE_CONFIRM_PASTE_REPLACE_DESCRIPTION,
  ENV_TABLE_CONFIRM_PASTE_REPLACE_TITLE,
  ENV_TABLE_CONFIRM_REMOVE_DESCRIPTION,
  ENV_TABLE_CONFIRM_REMOVE_TITLE,
} from '@/features/credentials/constants/credential-env-table';
import {
  countEnvMergeOverwrites,
  envRowHasProtectedData,
  findEnvRowIndexByKey,
} from '@/features/credentials/utils/credential-env-table-guards';
import { mergeEnvBundleEntries } from '@/features/credentials/utils/merge-env-bundle-entries';

export type EnvTableConfirmAction =
  | { kind: 'remove'; index: number; key: string }
  | { kind: 'key-overwrite'; index: number; newKey: string }
  | { kind: 'paste-replace' }
  | { kind: 'paste-merge' };

interface UseEnvTableConfirmParams {
  tableRows: EnvBundleEntry[];
  serverKeySet: ReadonlySet<string>;
  revealedByKey: ReadonlyMap<string, string>;
  pendingPasteEntries: EnvBundleEntry[];
  onApplyRows: (rows: EnvBundleEntry[], toastMessage: string) => void;
  onRemoveIndex: (index: number) => void;
  onApplyKey: (index: number, key: string) => void;
  onResolveKeyOverwrite: (index: number, newKey: string) => void;
  onClearPastePending: () => void;
}

export function useEnvTableConfirm({
  tableRows,
  serverKeySet,
  revealedByKey,
  pendingPasteEntries,
  onApplyRows,
  onRemoveIndex,
  onApplyKey,
  onResolveKeyOverwrite,
  onClearPastePending,
}: UseEnvTableConfirmParams) {
  const [action, setAction] = useState<EnvTableConfirmAction | null>(null);
  const [pasteChoiceOpen, setPasteChoiceOpen] = useState(false);

  const closeConfirm = useCallback(() => setAction(null), []);

  const executeConfirm = useCallback(() => {
    if (!action) return;
    switch (action.kind) {
      case 'remove':
        onRemoveIndex(action.index);
        break;
      case 'key-overwrite':
        onResolveKeyOverwrite(action.index, action.newKey);
        break;
      case 'paste-replace':
        onApplyRows(pendingPasteEntries, `Replaced with ${pendingPasteEntries.length} variables`);
        onClearPastePending();
        break;
      case 'paste-merge': {
        const merged = mergeEnvBundleEntries(tableRows, pendingPasteEntries);
        onApplyRows(merged, `Merged to ${merged.length} variables`);
        onClearPastePending();
        break;
      }
      default:
        break;
    }
    setAction(null);
    setPasteChoiceOpen(false);
  }, [
    action,
    onResolveKeyOverwrite,
    onApplyRows,
    onClearPastePending,
    onRemoveIndex,
    pendingPasteEntries,
    tableRows,
  ]);

  const requestRemove = useCallback(
    (index: number) => {
      const row = tableRows[index];
      if (!row || !envRowHasProtectedData(row, serverKeySet, revealedByKey)) {
        onRemoveIndex(index);
        return;
      }
      setAction({ kind: 'remove', index, key: row.key.trim() || 'variable' });
    },
    [onRemoveIndex, revealedByKey, serverKeySet, tableRows],
  );

  const requestKeyChange = useCallback(
    (index: number, newKey: string) => {
      const trimmed = newKey.trim();
      if (!trimmed) {
        onApplyKey(index, newKey);
        return;
      }
      const otherIndex = findEnvRowIndexByKey(tableRows, trimmed, index);
      if (otherIndex < 0) {
        onApplyKey(index, newKey);
        return;
      }
      const other = tableRows[otherIndex];
      if (!other || !envRowHasProtectedData(other, serverKeySet, revealedByKey)) {
        onApplyKey(index, newKey);
        return;
      }
      setAction({ kind: 'key-overwrite', index, newKey });
    },
    [onApplyKey, revealedByKey, serverKeySet, tableRows],
  );

  const openPasteChoice = useCallback(() => {
    setPasteChoiceOpen(true);
  }, []);

  const requestPasteMerge = useCallback(() => {
    const overwrites = countEnvMergeOverwrites(
      tableRows,
      pendingPasteEntries,
      serverKeySet,
      revealedByKey,
    );
    setPasteChoiceOpen(false);
    if (overwrites > 0) {
      setAction({ kind: 'paste-merge' });
      return;
    }
    const merged = mergeEnvBundleEntries(tableRows, pendingPasteEntries);
    onApplyRows(merged, `Merged to ${merged.length} variables`);
    onClearPastePending();
  }, [
    onApplyRows,
    onClearPastePending,
    pendingPasteEntries,
    revealedByKey,
    serverKeySet,
    tableRows,
  ]);

  const requestPasteReplace = useCallback(() => {
    setPasteChoiceOpen(false);
    setAction({ kind: 'paste-replace' });
  }, []);

  const deleteDialogProps: DeleteConfirmDialogProps | null = useMemo(() => {
    if (!action) return null;
    const base = {
      level: 'simple' as const,
      open: true,
      onOpenChange: (open: boolean) => {
        if (!open) closeConfirm();
      },
      isSubmitting: false,
      errorMessage: null,
      onConfirm: executeConfirm,
    };
    switch (action.kind) {
      case 'remove':
        return {
          ...base,
          itemName: action.key,
          title: ENV_TABLE_CONFIRM_REMOVE_TITLE,
          description: ENV_TABLE_CONFIRM_REMOVE_DESCRIPTION,
          confirmLabel: 'Remove',
        };
      case 'key-overwrite':
        return {
          ...base,
          itemName: action.newKey.trim(),
          title: ENV_TABLE_CONFIRM_KEY_OVERWRITE_TITLE,
          description: ENV_TABLE_CONFIRM_KEY_OVERWRITE_DESCRIPTION,
          confirmLabel: 'Replace',
        };
      case 'paste-replace':
        return {
          ...base,
          itemName: `${tableRows.filter((r) => r.key.trim()).length} variables`,
          title: ENV_TABLE_CONFIRM_PASTE_REPLACE_TITLE,
          description: ENV_TABLE_CONFIRM_PASTE_REPLACE_DESCRIPTION,
          confirmLabel: 'Replace all',
        };
      case 'paste-merge':
        return {
          ...base,
          itemName: `${countEnvMergeOverwrites(tableRows, pendingPasteEntries, serverKeySet, revealedByKey)} keys`,
          title: ENV_TABLE_CONFIRM_PASTE_MERGE_TITLE,
          description: ENV_TABLE_CONFIRM_PASTE_MERGE_DESCRIPTION,
          confirmLabel: 'Merge',
        };
      default:
        return null;
    }
  }, [
    action,
    closeConfirm,
    executeConfirm,
    pendingPasteEntries,
    revealedByKey,
    serverKeySet,
    tableRows,
  ]);

  return {
    pasteChoiceOpen,
    setPasteChoiceOpen,
    openPasteChoice,
    requestRemove,
    requestKeyChange,
    requestPasteMerge,
    requestPasteReplace,
    deleteDialogProps,
  };
}
