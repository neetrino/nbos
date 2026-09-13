'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { EnvBundleEntry } from '@nbos/shared';
import type { DeleteConfirmDialogProps } from '@/components/shared';
import {
  ENV_TABLE_CONFIRM_KEY_OVERWRITE_DESCRIPTION_KEY,
  ENV_TABLE_CONFIRM_KEY_OVERWRITE_TITLE_KEY,
  ENV_TABLE_CONFIRM_PASTE_MERGE_DESCRIPTION_KEY,
  ENV_TABLE_CONFIRM_PASTE_MERGE_TITLE_KEY,
  ENV_TABLE_CONFIRM_PASTE_REPLACE_DESCRIPTION_KEY,
  ENV_TABLE_CONFIRM_PASTE_REPLACE_TITLE_KEY,
  ENV_TABLE_CONFIRM_REMOVE_DESCRIPTION_KEY,
  ENV_TABLE_CONFIRM_REMOVE_TITLE_KEY,
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
  const t = useTranslations('credentials');
  const tCommon = useTranslations('common');
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
        onApplyRows(pendingPasteEntries, t('env.replaced', { count: pendingPasteEntries.length }));
        onClearPastePending();
        break;
      case 'paste-merge': {
        const merged = mergeEnvBundleEntries(tableRows, pendingPasteEntries);
        onApplyRows(merged, t('env.merged', { count: merged.length }));
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
    t,
    tableRows,
  ]);

  const requestRemove = useCallback(
    (index: number) => {
      const row = tableRows[index];
      if (!row || !envRowHasProtectedData(row, serverKeySet, revealedByKey)) {
        onRemoveIndex(index);
        return;
      }
      setAction({ kind: 'remove', index, key: row.key.trim() });
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
    onApplyRows(merged, t('env.merged', { count: merged.length }));
    onClearPastePending();
  }, [
    onApplyRows,
    onClearPastePending,
    pendingPasteEntries,
    revealedByKey,
    serverKeySet,
    t,
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
      dismissLabel: tCommon('cancel'),
      onConfirm: executeConfirm,
    };
    switch (action.kind) {
      case 'remove':
        return {
          ...base,
          itemName: action.key || t('env.variableFallback'),
          title: t(ENV_TABLE_CONFIRM_REMOVE_TITLE_KEY),
          description: t(ENV_TABLE_CONFIRM_REMOVE_DESCRIPTION_KEY),
          confirmLabel: t('env.remove'),
        };
      case 'key-overwrite':
        return {
          ...base,
          itemName: action.newKey.trim(),
          title: t(ENV_TABLE_CONFIRM_KEY_OVERWRITE_TITLE_KEY),
          description: t(ENV_TABLE_CONFIRM_KEY_OVERWRITE_DESCRIPTION_KEY),
          confirmLabel: t('env.replace'),
        };
      case 'paste-replace':
        return {
          ...base,
          itemName: t('env.variablesCount', {
            count: tableRows.filter((row) => row.key.trim()).length,
          }),
          title: t(ENV_TABLE_CONFIRM_PASTE_REPLACE_TITLE_KEY),
          description: t(ENV_TABLE_CONFIRM_PASTE_REPLACE_DESCRIPTION_KEY),
          confirmLabel: t('env.replaceAll'),
        };
      case 'paste-merge':
        return {
          ...base,
          itemName: t('env.keysCount', {
            count: countEnvMergeOverwrites(
              tableRows,
              pendingPasteEntries,
              serverKeySet,
              revealedByKey,
            ),
          }),
          title: t(ENV_TABLE_CONFIRM_PASTE_MERGE_TITLE_KEY),
          description: t(ENV_TABLE_CONFIRM_PASTE_MERGE_DESCRIPTION_KEY),
          confirmLabel: t('env.merge'),
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
    t,
    tCommon,
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
