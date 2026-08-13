import type { Subscription } from '@/lib/api/finance';
import type { UpdateSubscriptionPayload } from '@/lib/api/subscriptions';
import {
  parsePrepaidMonthCount,
  subscriptionToFormState,
  type SubscriptionFormState,
} from '@/features/finance/utils/subscription-form-state';

/** Editable subscription sheet state (General tab). */
export type SubscriptionGeneralDraft = SubscriptionFormState & {
  partnerPickLabel: string | null;
};

export function createSubscriptionGeneralDraft(
  subscription: Subscription,
): SubscriptionGeneralDraft {
  return {
    ...subscriptionToFormState(subscription),
    partnerPickLabel: subscription.partner?.name ?? null,
  };
}

function parseDraftAmount(raw: string): number | null {
  const amount = parseFloat(raw.replace(/\s/g, ''));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function parseDraftBillingDay(raw: string): number | null {
  const day = parseInt(raw, 10);
  return Number.isFinite(day) && day >= 1 && day <= 28 ? day : null;
}

function dateIsoOrNull(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return new Date(trimmed).toISOString();
}

function applyBillingFrequencyPatch(
  snap: SubscriptionGeneralDraft,
  draft: SubscriptionGeneralDraft,
  out: UpdateSubscriptionPayload,
): void {
  const frequencyChanged = draft.billingFrequency !== snap.billingFrequency;
  const prepaidChanged = draft.prepaidMonthCount !== snap.prepaidMonthCount;

  if (frequencyChanged) {
    out.billingFrequency = draft.billingFrequency;
    if (draft.billingFrequency === 'CUSTOM') {
      const count = parsePrepaidMonthCount(draft.prepaidMonthCount);
      if (count != null) out.prepaidMonthCount = count;
    }
    return;
  }

  if (draft.billingFrequency === 'CUSTOM' && prepaidChanged) {
    out.billingFrequency = draft.billingFrequency;
    const count = parsePrepaidMonthCount(draft.prepaidMonthCount);
    if (count != null) out.prepaidMonthCount = count;
  }
}

export function buildSubscriptionGeneralPatch(
  snap: SubscriptionGeneralDraft,
  draft: SubscriptionGeneralDraft,
): UpdateSubscriptionPayload {
  const out: UpdateSubscriptionPayload = {};

  if (draft.type !== snap.type) out.type = draft.type;

  const amount = parseDraftAmount(draft.baseMonthlyAmount);
  const snapAmount = parseDraftAmount(snap.baseMonthlyAmount);
  if (amount != null && amount !== snapAmount) out.baseMonthlyAmount = amount;

  applyBillingFrequencyPatch(snap, draft, out);

  const billingDay = parseDraftBillingDay(draft.billingDay);
  const snapBillingDay = parseDraftBillingDay(snap.billingDay);
  if (billingDay != null && billingDay !== snapBillingDay) out.billingDay = billingDay;

  if (draft.taxStatus !== snap.taxStatus) out.taxStatus = draft.taxStatus;

  const billingStart = dateIsoOrNull(draft.billingStartDate);
  const snapStart = dateIsoOrNull(snap.billingStartDate);
  if (billingStart && billingStart !== snapStart) out.billingStartDate = billingStart;

  if (draft.notificationsEnabled !== snap.notificationsEnabled) {
    out.notificationsEnabled = draft.notificationsEnabled;
  }

  if (draft.reminderLanguage !== snap.reminderLanguage) {
    out.reminderLanguage = draft.reminderLanguage;
  }

  const endIso = dateIsoOrNull(draft.endDate);
  const snapEndIso = dateIsoOrNull(snap.endDate);
  if (endIso !== snapEndIso) {
    out.endDate = draft.endDate.trim() ? (endIso ?? undefined) : '';
  }

  const partnerId = draft.partnerId.trim() || null;
  const snapPartnerId = snap.partnerId.trim() || null;
  if (partnerId !== snapPartnerId) out.partnerId = partnerId;

  return out;
}

export function isSubscriptionGeneralDirty(
  a: SubscriptionGeneralDraft,
  b: SubscriptionGeneralDraft,
): boolean {
  return JSON.stringify(a) !== JSON.stringify(b);
}
