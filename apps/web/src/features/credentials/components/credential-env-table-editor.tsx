'use client';

import { useEffect, useMemo, useState, type ClipboardEvent } from 'react';
import { ChevronDown, Copy, Download, Eye, Plus } from 'lucide-react';
import {
  entriesFromEnvBundleSerialized,
  parseEnvBundleText,
  serializeEnvBundle,
  type EnvBundleEntry,
} from '@nbos/shared';
import { Button } from '@/components/ui/button';
import { CredentialEnvPasteDialog } from '@/features/credentials/components/credential-env-paste-dialog';
import { CredentialEnvTableRow } from '@/features/credentials/components/credential-env-table-row';
import { CREDENTIAL_ENV_TABLE_PREVIEW_ROWS } from '@/features/credentials/constants/credential-env-table';
import {
  ENV_TABLE_VALUE_EMPTY_PLACEHOLDER,
  ENV_TABLE_VALUE_MASK_DISPLAY,
} from '@/features/credentials/constants/credential-env-table';
import {
  buildEnvTableRows,
  envRowValueIsMasked,
  revealedEnvValueByKey,
} from '@/features/credentials/utils/build-env-table-rows';
import { downloadEnvBundleFile } from '@/features/credentials/utils/download-env-bundle-file';
import {
  clipLooksLikeEnvBundle,
  clipSingleEnvPair,
} from '@/features/credentials/utils/env-bundle-clipboard';
import { mergeEnvBundleEntries } from '@/features/credentials/utils/merge-env-bundle-entries';
import { toast } from 'sonner';

const EMPTY_ENV_ROW: EnvBundleEntry = { key: '', value: '' };

export interface CredentialEnvTableEditorProps {
  instanceKey: string;
  value: string;
  onChange: (serialized: string) => void;
  hasStoredBundle?: boolean;
  valuesLocked?: boolean;
  revealedValue?: string | null;
  onReveal?: () => void;
  onCopy?: () => void | Promise<boolean>;
  onDownload?: () => Promise<string | null>;
  isExisting?: boolean;
}

export function CredentialEnvTableEditor({
  instanceKey,
  value,
  onChange,
  hasStoredBundle = false,
  valuesLocked = false,
  revealedValue,
  onReveal,
  onCopy,
  onDownload,
  isExisting,
}: CredentialEnvTableEditorProps) {
  const [localEntries, setLocalEntries] = useState<EnvBundleEntry[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false);
  const [pendingPasteEntries, setPendingPasteEntries] = useState<EnvBundleEntry[]>([]);

  useEffect(() => {
    setLocalEntries([]);
    setExpanded(false);
  }, [instanceKey]);

  const parsedFromValue = useMemo(() => entriesFromEnvBundleSerialized(value), [value]);
  const parsedFromRevealed = useMemo(
    () => (revealedValue ? entriesFromEnvBundleSerialized(revealedValue) : []),
    [revealedValue],
  );
  const revealedByKey = useMemo(() => revealedEnvValueByKey(revealedValue), [revealedValue]);
  const serverKeySet = useMemo(
    () => new Set(parsedFromValue.map((entry) => entry.key).filter((key) => key.trim().length > 0)),
    [parsedFromValue],
  );

  const tableRows = useMemo(
    () => buildEnvTableRows(localEntries, parsedFromValue, parsedFromRevealed, valuesLocked),
    [localEntries, parsedFromValue, parsedFromRevealed, valuesLocked],
  );

  const rowsForTable = useMemo(
    () => (tableRows.length > 0 ? tableRows : [EMPTY_ENV_ROW]),
    [tableRows],
  );

  const showMasked = Boolean(isExisting && valuesLocked);

  const exportEntries = useMemo(() => {
    return rowsForTable
      .filter((row) => row.key.trim().length > 0)
      .map((row) => ({
        key: row.key,
        value: row.value.trim() ? row.value : (revealedByKey.get(row.key) ?? ''),
      }));
  }, [revealedByKey, rowsForTable]);

  const hasStoredKeys =
    rowsForTable.some((row) => row.key.trim().length > 0) || (isExisting && hasStoredBundle);

  const canExportBundle =
    (isExisting && hasStoredBundle && Boolean(onCopy)) ||
    rowsForTable.some((row) => row.key.trim().length > 0);

  const hiddenRowCount = Math.max(0, rowsForTable.length - CREDENTIAL_ENV_TABLE_PREVIEW_ROWS);
  const visibleRowRefs = useMemo(
    () =>
      rowsForTable
        .map((row, index) => ({ row, index }))
        .filter(({ index }) => expanded || index < CREDENTIAL_ENV_TABLE_PREVIEW_ROWS),
    [expanded, rowsForTable],
  );

  const commitEntries = (next: EnvBundleEntry[]) => {
    setLocalEntries(next);
    onChange(serializeEnvBundle(next));
  };

  const finishPaste = (next: EnvBundleEntry[], message: string) => {
    commitEntries(next);
    setPendingPasteEntries([]);
    setPasteDialogOpen(false);
    toast.success(message);
  };

  const tryApplyBulk = (text: string) => {
    const parsed = parseEnvBundleText(text);
    if (parsed.entries.length === 0) {
      toast.error('No valid KEY=value lines found');
      return;
    }
    if (hasStoredKeys) {
      setPendingPasteEntries(parsed.entries);
      setPasteDialogOpen(true);
      return;
    }
    finishPaste(parsed.entries, `Applied ${parsed.entries.length} variables`);
  };

  const handleCellPaste = (index: number, event: ClipboardEvent<HTMLInputElement>) => {
    const clip = event.clipboardData.getData('text/plain');
    if (!clip.trim()) return;

    if (clipLooksLikeEnvBundle(clip)) {
      event.preventDefault();
      tryApplyBulk(clip);
      return;
    }

    const single = clipSingleEnvPair(clip);
    if (single) {
      event.preventDefault();
      const base = tableRows.length > 0 ? [...tableRows] : [EMPTY_ENV_ROW];
      base[index] = single;
      commitEntries(base);
    }
  };

  const updateRow = (index: number, patch: Partial<EnvBundleEntry>) => {
    const base = tableRows.length > 0 ? [...tableRows] : [EMPTY_ENV_ROW];
    const current = base[index] ?? EMPTY_ENV_ROW;
    base[index] = { ...current, ...patch };
    commitEntries(base);
  };

  const removeRow = (index: number) => {
    const next = tableRows.filter((_, i) => i !== index);
    commitEntries(next.length > 0 ? next : []);
  };

  const addRow = () => {
    commitEntries([EMPTY_ENV_ROW, ...tableRows]);
    if (rowsForTable.length >= CREDENTIAL_ENV_TABLE_PREVIEW_ROWS) {
      setExpanded(true);
    }
  };

  const copyRow = async (row: EnvBundleEntry) => {
    if (!row.key.trim()) return;
    const secret = row.value.trim() || revealedByKey.get(row.key) || '';
    await navigator.clipboard.writeText(`${row.key}=${secret}`);
    toast.success('Copied line');
  };

  const handleRevealAll = () => {
    if (revealedValue) return;
    onReveal?.();
  };

  const handleCopyBundle = async () => {
    if (isExisting && hasStoredBundle && onCopy) {
      await onCopy();
      return;
    }
    if (exportEntries.length === 0) return;
    await navigator.clipboard.writeText(serializeEnvBundle(exportEntries));
    toast.success('Copied');
  };

  const handleDownloadBundle = async () => {
    if (isExisting && hasStoredBundle && onDownload) {
      await onDownload();
      return;
    }
    if (exportEntries.length === 0) return;
    downloadEnvBundleFile(exportEntries);
    toast.success('Downloaded .env');
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="mr-1 size-3.5" />
            Add Variable
          </Button>
          {isExisting ? (
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={!hasStoredBundle || Boolean(revealedValue)}
              onClick={handleRevealAll}
              aria-label="Reveal all values"
            >
              <Eye className="size-3.5" />
            </Button>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canExportBundle}
            onClick={() => void handleCopyBundle()}
          >
            <Copy className="mr-1 size-3.5" />
            Copy
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canExportBundle}
            onClick={() => void handleDownloadBundle()}
          >
            <Download className="mr-1 size-3.5" />
            Download
          </Button>
        </div>
      </div>

      <div className="border-border overflow-hidden rounded-lg border">
        <div className="bg-muted/40 text-muted-foreground grid grid-cols-[1fr_1fr_auto] gap-2 px-3 py-2 text-xs font-medium">
          <span>Key</span>
          <span>Value</span>
          <span className="text-right">Actions</span>
        </div>
        {visibleRowRefs.map(({ row, index }) => (
          <CredentialEnvTableRow
            key={`${instanceKey}-row-${index}`}
            row={row}
            maskValue={envRowValueIsMasked(row, showMasked, serverKeySet, revealedByKey)}
            valueMaskDisplay={ENV_TABLE_VALUE_MASK_DISPLAY}
            valueEmptyPlaceholder={ENV_TABLE_VALUE_EMPTY_PLACEHOLDER}
            onKeyChange={(key) => updateRow(index, { key })}
            onValueChange={(val) => updateRow(index, { value: val })}
            onPaste={(event) => handleCellPaste(index, event)}
            onRemove={() => removeRow(index)}
            onCopy={() => void copyRow(row)}
          />
        ))}
        {hiddenRowCount > 0 && !expanded ? (
          <div className="border-border border-t px-3 py-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-center gap-1"
              onClick={() => setExpanded(true)}
            >
              <ChevronDown className="size-3.5" />
              Show all ({rowsForTable.length} variables)
            </Button>
          </div>
        ) : null}
      </div>

      <CredentialEnvPasteDialog
        open={pasteDialogOpen}
        onOpenChange={setPasteDialogOpen}
        incomingCount={pendingPasteEntries.length}
        existingCount={tableRows.filter((row) => row.key.trim()).length}
        onReplace={() =>
          finishPaste(pendingPasteEntries, `Replaced with ${pendingPasteEntries.length} variables`)
        }
        onMerge={() => {
          const merged = mergeEnvBundleEntries(tableRows, pendingPasteEntries);
          finishPaste(merged, `Merged to ${merged.length} variables`);
        }}
      />
    </div>
  );
}
