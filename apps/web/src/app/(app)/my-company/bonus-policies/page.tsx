'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ErrorState, LoadingState, PageHero } from '@/components/shared';
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

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        title="Bonus policies"
        trailing={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => void load()}
          >
            Refresh
          </Button>
        }
      />
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

      {loading ? (
        <LoadingState variant="cards" count={2} />
      ) : error && items.length === 0 ? (
        <ErrorState description={error} onRetry={() => void load()} />
      ) : (
        <>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <div className="border-border bg-card rounded-2xl border p-4">
            <h2 className="text-foreground mb-3 text-sm font-semibold">New policy</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Name</span>
                <Input
                  value={newName}
                  disabled={creating}
                  placeholder="e.g. Delivery manual Q2"
                  onChange={(e) => setNewName(e.target.value)}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Template</span>
                <select
                  className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                  value={newTemplate}
                  disabled={creating}
                  onChange={(e) => setNewTemplate(e.target.value)}
                >
                  {BONUS_POLICY_TEMPLATE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm md:col-span-2">
                <span className="text-muted-foreground">Scope (optional)</span>
                <Input
                  value={newScope}
                  disabled={creating}
                  onChange={(e) => setNewScope(e.target.value)}
                />
              </label>
              <label className="space-y-1 text-sm md:col-span-2">
                <span className="text-muted-foreground">Notes (optional)</span>
                <Textarea
                  value={newNotes}
                  disabled={creating}
                  rows={2}
                  className="resize-y"
                  onChange={(e) => setNewNotes(e.target.value)}
                />
              </label>
            </div>
            {selectedTemplate ? (
              <p className="text-muted-foreground mt-2 text-xs">{selectedTemplate.hint}</p>
            ) : null}
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                size="sm"
                disabled={creating}
                onClick={() => void handleCreate()}
              >
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
      )}
    </div>
  );
}
