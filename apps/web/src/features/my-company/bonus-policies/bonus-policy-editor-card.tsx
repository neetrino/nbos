'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { InlineField, StatusBadge } from '@/components/shared';
import { bonusPolicyTemplateLabel } from '@/features/my-company/bonus-policies/bonus-policy-template-options';
import type { BonusPolicyRow, BonusPolicyStatus } from '@/lib/api/bonus-policies';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ARCHIVED', label: 'Archived' },
];

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
        {policy.linkedProfileCount > 0 ? (
          <span className="text-muted-foreground text-xs">
            {policy.linkedProfileCount} compensation profile
            {policy.linkedProfileCount === 1 ? '' : 's'}
          </span>
        ) : null}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <InlineField
          variant="controlled"
          label="Policy name"
          value={name}
          disabled={saving}
          onValueChange={setName}
        />
        <InlineField
          variant="controlled"
          type="select"
          label="Status"
          value={status}
          options={STATUS_OPTIONS}
          disabled={saving}
          onValueChange={(value) => setStatus(value as BonusPolicyStatus)}
        />
        <InlineField
          variant="controlled"
          label="Scope"
          value={scope}
          placeholder="COMPANY, SALES, DELIVERY"
          disabled={saving}
          onValueChange={setScope}
          className="md:col-span-2"
        />
        <InlineField
          variant="controlled"
          type="textarea"
          label="Notes"
          value={notes}
          disabled={saving}
          onValueChange={setNotes}
          className="md:col-span-2"
        />
      </div>
      <div className="mt-4 flex justify-end">
        <Button type="button" size="sm" disabled={saving} onClick={() => void handleSave()}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
