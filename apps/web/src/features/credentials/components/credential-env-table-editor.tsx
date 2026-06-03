'use client';

import { useMemo, useState, type ClipboardEvent } from 'react';
import { Copy, Download, Eye, Plus, Trash2 } from 'lucide-react';
import {
  entriesFromEnvBundleSerialized,
  parseEnvBundleText,
  serializeEnvBundle,
  type EnvBundleEntry,
} from '@nbos/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CredentialEnvPasteDialog } from '@/features/credentials/components/credential-env-paste-dialog';
import { downloadEnvBundleFile } from '@/features/credentials/utils/download-env-bundle-file';
import {
  clipLooksLikeEnvBundle,
  clipSingleEnvPair,
} from '@/features/credentials/utils/env-bundle-clipboard';
import { mergeEnvBundleEntries } from '@/features/credentials/utils/merge-env-bundle-entries';
import { toast } from 'sonner';

const EMPTY_ENV_ROW: EnvBundleEntry = { key: '', value: '' };

export interface CredentialEnvTableEditorProps {
  value: string;
  onChange: (serialized: string) => void;
  disabled?: boolean;
  revealedValue?: string | null;
  onReveal?: () => void;
  onCopy?: () => void;
  isExisting?: boolean;
}

export function CredentialEnvTableEditor({
  value,
  onChange,
  disabled,
  revealedValue,
  onReveal,
  onCopy,
  isExisting,
}: CredentialEnvTableEditorProps) {
  const [localEntries, setLocalEntries] = useState<EnvBundleEntry[]>([]);
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false);
  const [pendingPasteEntries, setPendingPasteEntries] = useState<EnvBundleEntry[]>([]);

  const entries = useMemo(() => {
    if (localEntries.length > 0) return localEntries;
    return entriesFromEnvBundleSerialized(value);
  }, [localEntries, value]);

  const rowsForTable = useMemo(() => (entries.length > 0 ? entries : [EMPTY_ENV_ROW]), [entries]);

  const displayEntries = useMemo(() => {
    if (revealedValue) return entriesFromEnvBundleSerialized(revealedValue);
    return rowsForTable;
  }, [rowsForTable, revealedValue]);

  const hasStoredKeys = entries.some((row) => row.key.trim().length > 0);

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
      const base = entries.length > 0 ? [...entries] : [EMPTY_ENV_ROW];
      base[index] = single;
      commitEntries(base);
    }
  };

  const updateRow = (index: number, patch: Partial<EnvBundleEntry>) => {
    const base = entries.length > 0 ? [...entries] : [EMPTY_ENV_ROW];
    base[index] = { ...base[index], ...patch };
    commitEntries(base);
  };

  const removeRow = (index: number) => {
    const next = entries.filter((_, i) => i !== index);
    commitEntries(next.length > 0 ? next : []);
  };

  const addRow = () => {
    commitEntries([...entries, EMPTY_ENV_ROW]);
  };

  const copyRow = async (entry: EnvBundleEntry) => {
    await navigator.clipboard.writeText(`${entry.key}=${entry.value}`);
    toast.success('Copied line');
  };

  return (
    <div className="grid gap-4">
      {isExisting ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onReveal}>
            <Eye className="mr-1 size-3.5" />
            Reveal all
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onCopy}>
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
        {rowsForTable.map((row, index) => (
          <EnvRow
            key={`${row.key}-${index}`}
            row={row}
            maskedValue={displayEntries[index]?.value ?? ''}
            showMasked={Boolean(isExisting && !revealedValue)}
            disabled={disabled}
            onKeyChange={(key) => updateRow(index, { key })}
            onValueChange={(val) => updateRow(index, { value: val })}
            onPaste={(event) => handleCellPaste(index, event)}
            onRemove={() => removeRow(index)}
            onCopy={() => void copyRow(displayEntries[index] ?? row)}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={addRow}>
          <Plus className="mr-1 size-3.5" />
          Add variable
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasStoredKeys}
          onClick={() => downloadEnvBundleFile(displayEntries)}
        >
          <Download className="mr-1 size-3.5" />
          Download .env
        </Button>
      </div>

      <CredentialEnvPasteDialog
        open={pasteDialogOpen}
        onOpenChange={setPasteDialogOpen}
        incomingCount={pendingPasteEntries.length}
        existingCount={entries.filter((row) => row.key.trim()).length}
        onReplace={() =>
          finishPaste(pendingPasteEntries, `Replaced with ${pendingPasteEntries.length} variables`)
        }
        onMerge={() => {
          const merged = mergeEnvBundleEntries(entries, pendingPasteEntries);
          finishPaste(merged, `Merged to ${merged.length} variables`);
        }}
      />
    </div>
  );
}

function EnvRow({
  row,
  maskedValue,
  showMasked,
  disabled,
  onKeyChange,
  onValueChange,
  onPaste,
  onRemove,
  onCopy,
}: {
  row: EnvBundleEntry;
  maskedValue: string;
  showMasked: boolean;
  disabled?: boolean;
  onKeyChange: (key: string) => void;
  onValueChange: (value: string) => void;
  onPaste: (event: ClipboardEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  onCopy: () => void;
}) {
  return (
    <div className="border-border grid grid-cols-[1fr_1fr_auto] items-center gap-2 border-t px-3 py-2">
      <Input
        value={row.key}
        onChange={(e) => onKeyChange(e.target.value)}
        onPaste={onPaste}
        placeholder="KEY or paste .env"
        className="font-mono text-xs"
        disabled={disabled}
      />
      <Input
        value={showMasked ? '••••••••' : maskedValue}
        onChange={(e) => onValueChange(e.target.value)}
        onPaste={onPaste}
        placeholder="value"
        className="font-mono text-xs"
        disabled={disabled || showMasked}
        readOnly={showMasked}
      />
      <div className="flex justify-end gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onCopy}
          aria-label="Copy line"
        >
          <Copy size={14} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label="Remove line"
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  );
}
