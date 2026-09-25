import { BONUS_POLICY_TEMPLATE_MANUAL_ONLY } from '@/features/my-company/compensation/bonus-policy-template-codes';
import {
  bonusPoliciesApi,
  type BonusPolicyRow,
  type BonusPolicyStatus,
} from '@/lib/api/bonus-policies';

export type BonusPolicyDraft = {
  name: string;
  templateCode: string;
  status: BonusPolicyStatus;
  scope: string;
  notes: string;
};

export function draftFromPolicy(policy: BonusPolicyRow | null): BonusPolicyDraft {
  return {
    name: policy?.name ?? '',
    templateCode: policy?.templateCode ?? BONUS_POLICY_TEMPLATE_MANUAL_ONLY,
    status: policy?.status ?? 'ACTIVE',
    scope: policy?.scope ?? 'COMPANY',
    notes: policy?.notes ?? '',
  };
}

export function isBonusPolicyDraftDirty(
  draft: BonusPolicyDraft,
  policy: BonusPolicyRow | null,
): boolean {
  const saved = draftFromPolicy(policy);
  return (
    draft.name !== saved.name ||
    draft.templateCode !== saved.templateCode ||
    draft.status !== saved.status ||
    draft.scope !== saved.scope ||
    draft.notes !== saved.notes
  );
}

export async function persistBonusPolicy(
  policy: BonusPolicyRow | null,
  draft: BonusPolicyDraft,
): Promise<BonusPolicyRow> {
  const name = draft.name.trim();
  const scope = draft.scope.trim();
  const notes = draft.notes.trim();
  if (policy == null) {
    return bonusPoliciesApi.create({
      name,
      templateCode: draft.templateCode,
      scope: scope || undefined,
      notes: notes || undefined,
    });
  }
  return bonusPoliciesApi.update(policy.id, {
    name,
    status: draft.status,
    scope: scope === '' ? null : scope,
    notes: notes === '' ? null : notes,
  });
}
