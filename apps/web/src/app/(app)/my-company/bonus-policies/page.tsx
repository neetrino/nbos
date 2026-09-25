'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DataView,
  ErrorState,
  InlineField,
  ListMutationErrorBanner,
  LoadingState,
} from '@/components/shared';
import { useCompanySectionTabs } from '@/features/hr/components/use-company-section-tabs';
import { BonusPolicyEditorCard } from '@/features/my-company/bonus-policies/bonus-policy-editor-card';
import { BONUS_POLICY_TEMPLATE_OPTIONS } from '@/features/my-company/bonus-policies/bonus-policy-template-options';
import { BONUS_POLICY_TEMPLATE_MANUAL_ONLY } from '@/features/my-company/compensation/bonus-policy-template-codes';
import {
  bonusPoliciesApi,
  type BonusPolicyRow,
  type BonusPolicyStatus,
} from '@/lib/api/bonus-policies';

export default function BonusPoliciesPage() {
  const [items, setItems] = useState<BonusPolicyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTemplate, setNewTemplate] = useState(BONUS_POLICY_TEMPLATE_MANUAL_ONLY);
  const [newScope, setNewScope] = useState('COMPANY');
  const [newNotes, setNewNotes] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await bonusPoliciesApi.list();
      setItems(resp.items);
      setError(null);
    } catch {
      setError('Bonus policies could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (
    id: string,
    payload: {
      name: string;
      status: BonusPolicyStatus;
      scope: string | null;
      notes: string | null;
    },
  ) => {
    setSavingId(id);
    try {
      const updated = await bonusPoliciesApi.update(id, payload);
      setItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setError(null);
    } catch {
      setError('Save failed. Check the name and try again.');
    } finally {
      setSavingId(null);
    }
  };

  const handleCreate = async () => {
    if (newName.trim().length < 2) {
      setError('Enter a policy name (at least 2 characters).');
      return;
    }
    setCreating(true);
    try {
      const created = await bonusPoliciesApi.create({
        name: newName.trim(),
        templateCode: newTemplate,
        scope: newScope.trim() || undefined,
        notes: newNotes.trim() || undefined,
      });
      setItems((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
      setNewNotes('');
      setError(null);
    } catch {
      setError('Could not create policy.');
    } finally {
      setCreating(false);
    }
  };

  const selectedTemplate = BONUS_POLICY_TEMPLATE_OPTIONS.find((o) => o.value === newTemplate);
  const hasData = items.length > 0;
  const content = (
    <>
      <div className="border-border bg-card rounded-2xl border p-4">
        <h2 className="text-foreground mb-3 text-sm font-semibold">New policy</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <InlineField
            variant="controlled"
            label="Name"
            value={newName}
            placeholder="Delivery manual Q2"
            disabled={creating}
            onValueChange={setNewName}
          />
          <InlineField
            variant="controlled"
            type="select"
            label="Template"
            value={newTemplate}
            options={BONUS_POLICY_TEMPLATE_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            disabled={creating}
            onValueChange={(value) => {
              if (value) setNewTemplate(value);
            }}
          />
          <InlineField
            variant="controlled"
            label="Scope"
            value={newScope}
            placeholder="COMPANY"
            disabled={creating}
            onValueChange={setNewScope}
            className="md:col-span-2"
          />
          <InlineField
            variant="controlled"
            type="textarea"
            label="Notes"
            value={newNotes}
            disabled={creating}
            onValueChange={setNewNotes}
            className="md:col-span-2"
          />
        </div>
        {selectedTemplate ? (
          <p className="text-muted-foreground mt-2 text-xs">{selectedTemplate.hint}</p>
        ) : null}
        <div className="mt-4 flex justify-end">
          <Button type="button" size="sm" disabled={creating} onClick={() => void handleCreate()}>
            {creating ? 'Creating…' : 'Create policy'}
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        {items.map((policy) => (
          <BonusPolicyEditorCard
            key={policy.id}
            policy={policy}
            saving={savingId === policy.id}
            onSave={handleSave}
          />
        ))}
      </div>
    </>
  );

  const refresh = useMemo(
    () => (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => void load()}
      >
        Refresh
      </Button>
    ),
    [loading, load],
  );
  useCompanySectionTabs('bonus', refresh);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground text-sm">
        Rule bundles assigned on compensation profiles. Template code selects the accrual engine;
        seller percentages for{' '}
        <Link
          href="/my-company/sales-bonus-policies"
          className="text-primary underline-offset-2 hover:underline"
        >
          Sales bonus policies
        </Link>{' '}
        apply when template is Sales — company rate grid.
      </p>

      {error && hasData ? (
        <ListMutationErrorBanner message={error} onDismiss={() => setError(null)} />
      ) : null}
      <DataView
        loading={loading}
        error={error}
        hasData={hasData}
        loadingFallback={<LoadingState variant="cards" count={2} />}
        errorFallback={<ErrorState description={error ?? ''} onRetry={() => void load()} />}
        emptyFallback={content}
      >
        {content}
      </DataView>
    </div>
  );
}
