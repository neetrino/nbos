'use client';

import { useMemo, useState } from 'react';
import { parseEnvBundleText } from '@nbos/shared';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface CredentialEnvEditorProps {
  value: string;
  onChange: (serialized: string) => void;
  disabled?: boolean;
}

export function CredentialEnvEditor({ value, onChange, disabled }: CredentialEnvEditorProps) {
  const [pasteText, setPasteText] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const preview = useMemo(() => {
    if (!showPreview || !pasteText.trim()) return null;
    return parseEnvBundleText(pasteText);
  }, [pasteText, showPreview]);

  const applyPaste = () => {
    const parsed = parseEnvBundleText(pasteText);
    onChange(parsed.serialized);
    setPasteText('');
    setShowPreview(false);
  };

  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        <Label htmlFor="cred-env-paste">Paste .env</Label>
        <Textarea
          id="cred-env-paste"
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder="KEY=value&#10;OTHER=secret"
          className="font-mono text-xs"
          disabled={disabled}
          rows={4}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || !pasteText.trim()}
            onClick={() => setShowPreview(true)}
          >
            Preview
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={disabled || !pasteText.trim()}
            onClick={applyPaste}
          >
            Apply to bundle
          </Button>
        </div>
      </div>

      {preview && (
        <div className="border-border rounded-md border p-3 text-xs">
          <p className="text-muted-foreground mb-2">
            {preview.entries.length} variable{preview.entries.length === 1 ? '' : 's'}
          </p>
          {preview.warnings.length > 0 && (
            <ul className="mb-2 list-disc pl-4 text-amber-600 dark:text-amber-400">
              {preview.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
          <ul className="max-h-32 space-y-1 overflow-y-auto font-mono">
            {preview.entries.map((e) => (
              <li key={e.key}>
                <span className="text-foreground">{e.key}</span>
                <span className="text-muted-foreground">=••••</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {value ? (
        <p className="text-muted-foreground text-xs">
          Bundle stored ({value.split('\n').filter(Boolean).length} lines). Paste again to replace.
        </p>
      ) : null}
    </div>
  );
}
