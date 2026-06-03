'use client';

import { useMemo, useState } from 'react';
import { Copy, Download, Eye, Plus, Trash2 } from 'lucide-react';
import {
  entriesFromEnvBundleSerialized,
  parseEnvBundleText,
  serializeEnvBundle,
  type EnvBundleEntry,
} from '@nbos/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CredentialEnvPasteDialog } from '@/features/credentials/components/credential-env-paste-dialog';
import { downloadEnvBundleFile } from '@/features/credentials/utils/download-env-bundle-file';
import { mergeEnvBundleEntries } from '@/features/credentials/utils/merge-env-bundle-entries';
import { toast } from 'sonner';

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
  const [pasteText, setPasteText] = useState('');
  const [localEntries, setLocalEntries] = useState<EnvBundleEntry[]>([]);
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false);
  const [pendingPasteEntries, setPendingPasteEntries] = useState<EnvBundleEntry[]>([]);

  const entries = useMemo(() => {
    if (localEntries.length > 0) return localEntries;
    return entriesFromEnvBundleSerialized(value);
  }, [localEntries, value]);

  const displayEntries = useMemo(() => {
    if (revealedValue) return entriesFromEnvBundleSerialized(revealedValue);
    return entries;
  }, [entries, revealedValue]);

  const commitEntries = (next: EnvBundleEntry[]) => {
    setLocalEntries(next);
    onChange(serializeEnvBundle(next));
  };

  const finishPaste = (next: EnvBundleEntry[], message: string) => {
    commitEntries(next);
    setPasteText('');
    setPendingPasteEntries([]);
    setPasteDialogOpen(false);
    toast.success(message);
  };

  const applyPaste = () => {
    const parsed = parseEnvBundleText(pasteText);
    if (parsed.entries.length === 0) {
      toast.error('No valid KEY=value lines found');
      return;
    }
    const hasExisting = entries.some((row) => row.key.trim().length > 0);
    if (hasExisting) {
      setPendingPasteEntries(parsed.entries);
      setPasteDialogOpen(true);
      return;
    }
    finishPaste(parsed.entries, `Applied ${parsed.entries.length} variables`);
  };

  const updateRow = (index: number, patch: Partial<EnvBundleEntry>) => {
    const next = entries.map((row, i) => (i === index ? { ...row, ...patch } : row));
    commitEntries(next);
  };

  const removeRow = (index: number) => {
    commitEntries(entries.filter((_, i) => i !== index));
  };

  const addRow = () => {
    commitEntries([...entries, { key: '', value: '' }]);
  };

  const copyRow = async (entry: EnvBundleEntry) => {
    await navigator.clipboard.writeText(`${entry.key}=${entry.value}`);
    toast.success('Copied line');
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="cred-env-paste">Paste .env</Label>
        <Textarea
          id="cred-env-paste"
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder="KEY=value"
          className="font-mono text-xs"
          disabled={disabled}
          rows={3}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || !pasteText.trim()}
          onClick={applyPaste}
        >
          Parse and apply
        </Button>
      </div>

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
        {entries.length === 0 ? (
          <p className="text-muted-foreground px-3 py-4 text-sm">No variables yet.</p>
        ) : (
          entries.map((row, index) => (
            <EnvRow
              key={`${row.key}-${index}`}
              row={row}
              maskedValue={displayEntries[index]?.value ?? ''}
              showMasked={Boolean(isExisting && !revealedValue)}
              disabled={disabled}
              onKeyChange={(key) => updateRow(index, { key })}
              onValueChange={(val) => updateRow(index, { value: val })}
              onRemove={() => removeRow(index)}
              onCopy={() => void copyRow(displayEntries[index] ?? row)}
            />
          ))
        )}
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
          disabled={entries.length === 0}
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
  onRemove,
  onCopy,
}: {
  row: EnvBundleEntry;
  maskedValue: string;
  showMasked: boolean;
  disabled?: boolean;
  onKeyChange: (key: string) => void;
  onValueChange: (value: string) => void;
  onRemove: () => void;
  onCopy: () => void;
}) {
  return (
    <div className="border-border grid grid-cols-[1fr_1fr_auto] items-center gap-2 border-t px-3 py-2">
      <Input
        value={row.key}
        onChange={(e) => onKeyChange(e.target.value)}
        className="font-mono text-xs"
        disabled={disabled}
      />
      <Input
        value={showMasked ? '••••••••' : maskedValue}
        onChange={(e) => onValueChange(e.target.value)}
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
