'use client';

import { useEffect, useState } from 'react';
import { Sheet } from '@/components/ui/sheet';
import {
  DetailSheetFormFooter,
  DetailSheetSection,
  EntityDetailSheetContent,
} from '@/components/shared';
import { BonusPolicyFields } from '@/features/my-company/bonus-policies/bonus-policy-fields';
import {
  draftFromPolicy,
  isBonusPolicyDraftDirty,
  persistBonusPolicy,
  type BonusPolicyDraft,
} from '@/features/my-company/bonus-policies/bonus-policy-draft';
import {
  TEAM_SHEET_BODY_CLASS,
  TEAM_SHEET_HEADER_CLASS,
} from '@/features/hr/constants/team-sheet-layout';
import type { BonusPolicyRow } from '@/lib/api/bonus-policies';

export function BonusPolicySheet({
  policy,
  open,
  onOpenChange,
  onSaved,
}: {
  policy: BonusPolicyRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (row: BonusPolicyRow) => void;
}) {
  const [draft, setDraft] = useState<BonusPolicyDraft>(() => draftFromPolicy(policy));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(draftFromPolicy(policy));
    setError(null);
  }, [open, policy]);

  const save = async () => {
    if (draft.name.trim().length < 2) {
      setError('Name needs at least 2 characters.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = await persistBonusPolicy(policy, draft);
      onSaved(saved);
      onOpenChange(false);
    } catch {
      setError(policy ? 'Save failed. Check the name and try again.' : 'Could not create policy.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EntityDetailSheetContent
        open={open}
        layout="auxiliary"
        sourcePageHref="/my-company/bonus-policies"
      >
        <BonusPolicySheetBody
          policy={policy}
          draft={draft}
          saving={saving}
          error={error}
          dirty={isBonusPolicyDraftDirty(draft, policy)}
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

function BonusPolicySheetBody({
  policy,
  draft,
  saving,
  error,
  dirty,
  onChange,
  onSave,
  onCancel,
}: {
  policy: BonusPolicyRow | null;
  draft: BonusPolicyDraft;
  saving: boolean;
  error: string | null;
  dirty: boolean;
  onChange: (next: Partial<BonusPolicyDraft>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const title = policy == null ? 'New bonus policy' : draft.name || policy.name;
  const hint =
    policy == null
      ? 'This rule can be assigned on a salary.'
      : 'The calculation method stays fixed. Name, status, and notes can change.';

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={TEAM_SHEET_HEADER_CLASS}>
        <h2 className="truncate text-base font-semibold">{title}</h2>
        <p className="text-muted-foreground mt-1 text-xs">{hint}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className={TEAM_SHEET_BODY_CLASS}>
          <DetailSheetSection title="Policy" outlined>
            <BonusPolicyFields policy={policy} draft={draft} saving={saving} onChange={onChange} />
          </DetailSheetSection>
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
