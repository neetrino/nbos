'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { tasksApi } from '@/lib/api/tasks';
import { cn } from '@/lib/utils';

const QUICK_CREATE_WRAP =
  'flex min-h-10 min-w-0 items-center gap-1.5 rounded-full border-0 bg-background py-1 pr-1 pl-3 shadow-sm shadow-black/[0.05]';

const CREATE_CTA_CLASS =
  'h-8 shrink-0 rounded-full bg-sky-500 px-4 text-sm font-medium text-white shadow-sm shadow-sky-700/20 hover:bg-sky-600';

interface WorkSpacesQuickCreateProps {
  onCreated: () => void;
}

export function WorkSpacesQuickCreate({ onCreated }: WorkSpacesQuickCreateProps) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    try {
      await tasksApi.createWorkSpace({
        name: trimmed,
        type: 'STANDALONE_OPERATIONAL',
        scrumEnabled: false,
      });
      setName('');
      onCreated();
    } catch {
      setError('Could not create. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex w-full min-w-0 shrink-0 flex-col gap-1 sm:w-auto sm:max-w-[min(100%,280px)]">
      <div className={cn(QUICK_CREATE_WRAP)}>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name…"
          disabled={saving}
          className="h-8 min-w-0 flex-1 border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
          aria-label="New standalone work space name"
          onKeyDown={(e) => {
            if (e.key === 'Enter') void submit();
          }}
        />
        <Button
          type="button"
          size="sm"
          disabled={saving || !name.trim()}
          className={CREATE_CTA_CLASS}
          onClick={() => void submit()}
        >
          {saving ? '…' : 'Create'}
        </Button>
      </div>
      {error ? <p className="text-destructive px-0.5 text-xs">{error}</p> : null}
    </div>
  );
}
