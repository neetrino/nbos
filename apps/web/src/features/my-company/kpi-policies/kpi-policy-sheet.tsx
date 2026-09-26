'use client';

import { useEffect, useState } from 'react';
import { Sheet } from '@/components/ui/sheet';
import { DetailSheetFormFooter, EntityDetailSheetContent } from '@/components/shared';
import { KpiPolicyFields } from '@/features/my-company/kpi-policies/kpi-policy-fields';
import {
  draftFromPolicy,
  isKpiPolicyDraftDirty,
  kpiPolicyDraftError,
  persistKpiPolicy,
  type KpiPolicyDraft,
} from '@/features/my-company/kpi-policies/kpi-policy-draft';
import {
  TEAM_SHEET_BODY_CLASS,
  TEAM_SHEET_HEADER_CLASS,
} from '@/features/hr/constants/team-sheet-layout';
import type { KpiPolicyRow } from '@/lib/api/kpi-policies';

export function KpiPolicySheet({
  policy,
  open,
  onOpenChange,
  onSaved,
}: {
  policy: KpiPolicyRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (row: KpiPolicyRow) => void;
}) {
  const [draft, setDraft] = useState<KpiPolicyDraft>(() => draftFromPolicy(policy));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(draftFromPolicy(policy));
    setError(null);
  }, [open, policy]);

  const save = async () => {
    const invalid = kpiPolicyDraftError(draft);
    if (invalid) {
      setError(invalid);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = await persistKpiPolicy(policy, draft);
      onSaved(saved);
      onOpenChange(false);
    } catch {
      setError(policy ? 'Save failed. Check the steps and try again.' : 'Could not create policy.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EntityDetailSheetContent
        open={open}
        layout="auxiliary"
        sourcePageHref="/my-company/kpi-policies"
      >
        <KpiPolicySheetBody
          policy={policy}
          draft={draft}
          saving={saving}
          error={error}
          dirty={isKpiPolicyDraftDirty(draft, policy)}
          onChange={(next) => setDraft((current) => ({ ...current, ...next }))}
          onSave={() => void save()}
          onCancel={() => {
            setDraft(draftFromPolicy(policy));
            setError(null);
          }}
        />
      </EntityDetailSheetContent>
    </Sheet>
  );
}

function KpiPolicySheetBody({
  policy,
  draft,
  saving,
  error,
  dirty,
  onChange,
  onSave,
  onCancel,
}: {
  policy: KpiPolicyRow | null;
  draft: KpiPolicyDraft;
  saving: boolean;
  error: string | null;
  dirty: boolean;
  onChange: (next: Partial<KpiPolicyDraft>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const title = policy == null ? 'New KPI gate' : draft.name || policy.name;
  const hint =
    policy == null
      ? 'This gate can be assigned on a salary.'
      : 'Name, status, ceiling, and payout steps can change.';

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={TEAM_SHEET_HEADER_CLASS}>
        <h2 className="truncate text-base font-semibold">{title}</h2>
        <p className="text-muted-foreground mt-1 text-xs">{hint}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className={TEAM_SHEET_BODY_CLASS}>
          <KpiPolicyFields policy={policy} draft={draft} saving={saving} onChange={onChange} />
        </div>
      </div>
      <DetailSheetFormFooter
        visible
        dirty={dirty}
        saving={saving}
        errorMessage={error}
        onSave={onSave}
        onCancel={onCancel}
      />
    </div>
  );
}
