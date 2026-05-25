'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/shared';
import { bonusPolicyTemplateLabel } from '@/features/my-company/bonus-policies/bonus-policy-template-options';
import type { BonusPolicyRow, BonusPolicyStatus } from '@/lib/api/bonus-policies';

const STATUS_VARIANT: Record<string, 'green' | 'amber' | 'gray' | 'red'> = {
  ACTIVE: 'green',
  DRAFT: 'amber',
  ARCHIVED: 'gray',
};

export function BonusPolicyEditorCard({
  policy,
  saving,
  onSave,
}: {
  policy: BonusPolicyRow;
  saving: boolean;
  onSave: (
    id: string,
    payload: {
      name: string;
      status: BonusPolicyStatus;
      scope: string | null;
      notes: string | null;
    },
  ) => Promise<void>;
}) {
  const [name, setName] = useState(policy.name);
  const [status, setStatus] = useState(policy.status);
  const [scope, setScope] = useState(policy.scope ?? '');
  const [notes, setNotes] = useState(policy.notes ?? '');

  const handleSave = async () => {
    if (name.trim().length < 2) {
      return;
    }
    await onSave(policy.id, {
      name: name.trim(),
      status,
      scope: scope.trim() === '' ? null : scope.trim(),
      notes: notes.trim() === '' ? null : notes.trim(),
    });
  };

  return (
    <div className="border-border bg-card rounded-2xl border p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <StatusBadge label={policy.status} variant={STATUS_VARIANT[policy.status] ?? 'gray'} />
        <span className="text-muted-foreground text-xs">
          {bonusPolicyTemplateLabel(policy.templateCode)}
        </span>
        <span className="text-muted-foreground font-mono text-xs">{policy.templateCode}</span>
        {policy.linkedProfileCount > 0 ? (
          <span className="text-muted-foreground text-xs">
            {policy.linkedProfileCount} compensation profile
            {policy.linkedProfileCount === 1 ? '' : 's'}
          </span>
        ) : null}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Policy name</span>
          <Input value={name} disabled={saving} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Status</span>
          <select
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            value={status}
            disabled={saving}
            onChange={(e) => setStatus(e.target.value as BonusPolicyStatus)}
          >
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="text-muted-foreground">Scope (optional)</span>
          <Input
            value={scope}
            disabled={saving}
            placeholder="e.g. COMPANY, SALES, DELIVERY"
            onChange={(e) => setScope(e.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="text-muted-foreground">Notes</span>
          <Textarea
            value={notes}
            disabled={saving}
            rows={2}
            className="resize-y"
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
      </div>
      <div className="mt-4 flex justify-end">
        <Button type="button" size="sm" disabled={saving} onClick={() => void handleSave()}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
