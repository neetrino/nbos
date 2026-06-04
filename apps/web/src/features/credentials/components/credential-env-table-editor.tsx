'use client';

import { useEffect, useMemo, useRef, useState, type ClipboardEvent } from 'react';
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
  isExisting,
}: CredentialEnvTableEditorProps) {
  const [localEntries, setLocalEntries] = useState<EnvBundleEntry[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false);
  const [pendingPasteEntries, setPendingPasteEntries] = useState<EnvBundleEntry[]>([]);
  const revealRequestedRef = useRef<string | null>(null);

  useEffect(() => {
    setLocalEntries([]);
    setExpanded(false);
    revealRequestedRef.current = null;
  }, [instanceKey]);

  const parsedFromValue = useMemo(() => entriesFromEnvBundleSerialized(value), [value]);
  const parsedFromRevealed = useMemo(
    () => (revealedValue ? entriesFromEnvBundleSerialized(revealedValue) : []),
    [revealedValue],
  );

  const effectiveEntries = useMemo(() => {
    if (localEntries.length > 0) return localEntries;
    if (parsedFromValue.length > 0) return parsedFromValue;
    if (parsedFromRevealed.length > 0) {
      return parsedFromRevealed.map(({ key }) => ({ key, value: '' }));
    }
    return [];
  }, [localEntries, parsedFromValue, parsedFromRevealed]);

  const rowsForTable = useMemo(
    () => (effectiveEntries.length > 0 ? effectiveEntries : [EMPTY_ENV_ROW]),
    [effectiveEntries],
  );

  const displayEntries = useMemo(() => {
    if (parsedFromRevealed.length > 0) return parsedFromRevealed;
    return rowsForTable;
  }, [parsedFromRevealed, rowsForTable]);

  const hasStoredKeys =
    rowsForTable.some((row) => row.key.trim().length > 0) || (isExisting && hasStoredBundle);

  const canDownload =
    rowsForTable.some((row) => row.key.trim().length > 0) &&
    (!isExisting || Boolean(revealedValue?.trim()));

  const canCopyBundle =
    (isExisting && hasStoredBundle && Boolean(onCopy)) ||
    rowsForTable.some((row) => row.key.trim().length > 0);

  const showMasked = Boolean(isExisting && valuesLocked);
  const hiddenRowCount = Math.max(0, rowsForTable.length - CREDENTIAL_ENV_TABLE_PREVIEW_ROWS);
  const visibleRowRefs = useMemo(
    () =>
      rowsForTable
        .map((row, index) => ({ row, index }))
        .filter(({ index }) => expanded || index < CREDENTIAL_ENV_TABLE_PREVIEW_ROWS),
    [expanded, rowsForTable],
  );

  useEffect(() => {
    if (!isExisting || !hasStoredBundle || revealedValue) return;
    if (revealRequestedRef.current === instanceKey) return;
    revealRequestedRef.current = instanceKey;
    onReveal?.();
  }, [hasStoredBundle, instanceKey, isExisting, onReveal, revealedValue]);

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
      const base = effectiveEntries.length > 0 ? [...effectiveEntries] : [EMPTY_ENV_ROW];
      base[index] = single;
      commitEntries(base);
    }
  };

  const updateRow = (index: number, patch: Partial<EnvBundleEntry>) => {
    const base = effectiveEntries.length > 0 ? [...effectiveEntries] : [EMPTY_ENV_ROW];
    const current = base[index] ?? EMPTY_ENV_ROW;
    base[index] = { ...current, ...patch };
    commitEntries(base);
  };

  const removeRow = (index: number) => {
    const next = effectiveEntries.filter((_, i) => i !== index);
    commitEntries(next.length > 0 ? next : []);
  };

  const addRow = () => {
    commitEntries([...effectiveEntries, EMPTY_ENV_ROW]);
    if (rowsForTable.length >= CREDENTIAL_ENV_TABLE_PREVIEW_ROWS) {
      setExpanded(true);
    }
  };

  const copyRow = async (entry: EnvBundleEntry) => {
    const line = displayEntries.find((row) => row.key === entry.key) ?? entry;
    if (!line.key.trim()) return;
    await navigator.clipboard.writeText(`${line.key}=${line.value}`);
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
    const entries = displayEntries.filter((row) => row.key.trim().length > 0);
    if (entries.length === 0) return;
    await navigator.clipboard.writeText(serializeEnvBundle(entries));
    toast.success('Copied');
  };

  return (
    <div className="grid gap-4">
      {isExisting ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasStoredBundle || Boolean(revealedValue)}
            onClick={handleRevealAll}
          >
            <Eye className="mr-1 size-3.5" />
            Reveal all
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canCopyBundle}
            onClick={() => void handleCopyBundle()}
          >
            <Copy className="mr-1 size-3.5" />
            Copy bundle
          </Button>
        </div>
      ) : null}

      <div className="border-border overflow-hidden rounded-lg border">
        <div className="bg-muted/40 text-muted-foreground grid grid-cols-[1fr_1fr_auto] gap-2 px-3 py-2 text-xs font-medium">
          <span>Key</span>
          <span>Value</span>
          <span className="text-right">Actions</span>
        </div>
        {visibleRowRefs.map(({ row, index }) => (
          <CredentialEnvTableRow
            key={`${instanceKey}-${row.key}-${index}`}
            row={row}
            maskedValue={displayEntries[index]?.value ?? ''}
            showMasked={showMasked}
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

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="mr-1 size-3.5" />
          Add variable
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canDownload}
          onClick={() => downloadEnvBundleFile(displayEntries.filter((r) => r.key.trim()))}
        >
          <Download className="mr-1 size-3.5" />
          Download .env
        </Button>
      </div>

      <CredentialEnvPasteDialog
        open={pasteDialogOpen}
        onOpenChange={setPasteDialogOpen}
        incomingCount={pendingPasteEntries.length}
        existingCount={effectiveEntries.filter((row) => row.key.trim()).length}
        onReplace={() =>
          finishPaste(pendingPasteEntries, `Replaced with ${pendingPasteEntries.length} variables`)
        }
        onMerge={() => {
          const merged = mergeEnvBundleEntries(effectiveEntries, pendingPasteEntries);
          finishPaste(merged, `Merged to ${merged.length} variables`);
        }}
      />
    </div>
  );
}
