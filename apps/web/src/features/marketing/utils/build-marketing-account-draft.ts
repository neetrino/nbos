import type { MarketingAccount } from '@/lib/api/marketing';

export interface MarketingAccountDraft {
  name: string;
  identifier: string;
  phone: string;
  status: string;
  notes: string;
  financeExpensePlanId: string;
}

function asText(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

export function createMarketingAccountDraft(account: MarketingAccount): MarketingAccountDraft {
  return {
    name: account.name,
    identifier: asText(account.identifier),
    phone: asText(account.phone),
    status: account.status,
    notes: asText(account.notes),
    financeExpensePlanId: asText(account.financeExpensePlanId),
  };
}

function nullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function isMarketingAccountDraftDirty(
  draft: MarketingAccountDraft,
  snap: MarketingAccountDraft,
): boolean {
  return (
    draft.name.trim() !== snap.name.trim() ||
    nullable(draft.identifier) !== nullable(snap.identifier) ||
    nullable(draft.phone) !== nullable(snap.phone) ||
    draft.status !== snap.status ||
    nullable(draft.notes) !== nullable(snap.notes) ||
    nullable(draft.financeExpensePlanId) !== nullable(snap.financeExpensePlanId)
  );
}

export function buildMarketingAccountPatch(
  snap: MarketingAccountDraft,
  draft: MarketingAccountDraft,
): Partial<MarketingAccount> {
  const patch: Partial<MarketingAccount> = {};
  if (draft.name.trim() !== snap.name.trim()) patch.name = draft.name.trim();
  if (nullable(draft.identifier) !== nullable(snap.identifier)) {
    patch.identifier = nullable(draft.identifier);
  }
  if (nullable(draft.phone) !== nullable(snap.phone)) patch.phone = nullable(draft.phone);
  if (draft.status !== snap.status) patch.status = draft.status;
  if (nullable(draft.notes) !== nullable(snap.notes)) patch.notes = nullable(draft.notes);
  if (nullable(draft.financeExpensePlanId) !== nullable(snap.financeExpensePlanId)) {
    patch.financeExpensePlanId = nullable(draft.financeExpensePlanId);
  }
  return patch;
}
