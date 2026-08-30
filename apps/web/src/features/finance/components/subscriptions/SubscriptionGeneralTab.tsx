'use client';

import { useCallback, useEffect, useState } from 'react';
import { Calendar, DollarSign, Handshake, Layers, Repeat } from 'lucide-react';
import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DetailSheetCollapsibleSection,
  InlineField,
} from '@/components/shared';
import {
  EXPENSE_SHEET_FIELD_CELL_CLASS,
  EXPENSE_SHEET_FIELD_ROW_2_CLASS,
} from '@/features/finance/components/expenses/edit-expense-dialog-constants';
import {
  CUSTOM_PREPAID_MONTH_MAX,
  CUSTOM_PREPAID_MONTH_MIN,
  SUBSCRIPTION_BILLING_FREQUENCIES,
  SUBSCRIPTION_TYPES,
} from '@/features/finance/constants/finance';
import { applyBillingPeriodChangeToDraft } from '@/features/finance/utils/subscription-billing-period-change';
import type { SubscriptionGeneralDraft } from '@/features/finance/utils/subscription-general-form-state';
import {
  getSubscriptionBillingValidationError,
  getSubscriptionPeriodAmountLabel,
} from '@/features/finance/utils/subscription-form-state';
import { partnersApi } from '@/lib/api/partners';
import { SubscriptionAmountTaxField } from './SubscriptionAmountTaxField';
import { SubscriptionDetailLinkedPanel } from './SubscriptionDetailLinkedPanel';
import { SubscriptionNotificationSettingsRow } from './SubscriptionNotificationSettingsRow';
import { SubscriptionTermSummary } from './SubscriptionTermSummary';
import type { Subscription } from '@/lib/api/finance';

interface SubscriptionGeneralTabProps {
  subscription: Subscription;
  draft: SubscriptionGeneralDraft;
  patchDraft: (partial: Partial<SubscriptionGeneralDraft>) => void;
  replaceDraft: (next: SubscriptionGeneralDraft) => void;
  formDisabled?: boolean;
}

export function SubscriptionGeneralTab({
  subscription,
  draft,
  patchDraft,
  replaceDraft,
  formDisabled = false,
}: SubscriptionGeneralTabProps) {
  const [partnerOptions, setPartnerOptions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    let cancelled = false;
    partnersApi
      .getAll({ page: 1, pageSize: 100 })
      .then((res) => {
        if (!cancelled) {
          setPartnerOptions(res.items.map((p) => ({ value: p.id, label: p.name })));
        }
      })
      .catch(() => {
        if (!cancelled) setPartnerOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const partnerSelectOptions = [{ value: '', label: 'None' }, ...partnerOptions];
  const [billingOpen, setBillingOpen] = useState(true);
  const billingValidationError = getSubscriptionBillingValidationError(draft);
  const monthlyEquivalent = parseFloat(subscription.monthlyEquivalentAmount);

  const onBillingFrequencyChange = useCallback(
    (value: string) => {
      replaceDraft({
        ...applyBillingPeriodChangeToDraft(
          draft,
          {
            billingFrequency: value,
            coverageMonthCount: value === 'CUSTOM' ? draft.coverageMonthCount : '',
          },
          monthlyEquivalent,
        ),
        partnerPickLabel: draft.partnerPickLabel,
      });
    },
    [draft, monthlyEquivalent, replaceDraft],
  );

  const onCoverageMonthCountChange = useCallback(
    (value: string) => {
      replaceDraft({
        ...applyBillingPeriodChangeToDraft(draft, { coverageMonthCount: value }, monthlyEquivalent),
        partnerPickLabel: draft.partnerPickLabel,
      });
    },
    [draft, monthlyEquivalent, replaceDraft],
  );

  const onPartnerChange = useCallback(
    (value: string) => {
      const option = partnerOptions.find((p) => p.value === value);
      patchDraft({
        partnerId: value,
        partnerPickLabel: option?.label ?? null,
      });
    },
    [partnerOptions, patchDraft],
  );

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <DetailSheetCollapsibleSection
        title="Billing"
        icon={<DollarSign size={12} />}
        open={billingOpen}
        onOpenChange={setBillingOpen}
      >
        <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
          <div className={EXPENSE_SHEET_FIELD_ROW_2_CLASS}>
            <SubscriptionAmountTaxField
              amountLabel={getSubscriptionPeriodAmountLabel(draft.billingFrequency)}
              amount={draft.amount}
              taxStatus={draft.taxStatus}
              disabled={formDisabled}
              onAmountChange={(amount) => patchDraft({ amount })}
              onTaxStatusChange={(taxStatus) => patchDraft({ taxStatus })}
            />
            <InlineField
              variant="controlled"
              label="Type"
              type="select"
              value={draft.type}
              options={SUBSCRIPTION_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              icon={<Layers size={12} />}
              disabled={formDisabled}
              className={EXPENSE_SHEET_FIELD_CELL_CLASS}
              onValueChange={(v) => v && patchDraft({ type: v })}
            />
          </div>
          <div className={EXPENSE_SHEET_FIELD_ROW_2_CLASS}>
            <InlineField
              variant="controlled"
              label="Frequency"
              type="select"
              value={draft.billingFrequency}
              options={SUBSCRIPTION_BILLING_FREQUENCIES.map((f) => ({
                value: f.value,
                label: f.label,
              }))}
              icon={<Repeat size={12} />}
              disabled={formDisabled}
              className={EXPENSE_SHEET_FIELD_CELL_CLASS}
              onValueChange={(v) => v && onBillingFrequencyChange(v)}
            />
            <InlineField
              variant="controlled"
              label="Billing day"
              type="number"
              value={draft.billingDay}
              placeholder="1–28"
              icon={<Calendar size={12} />}
              disabled={formDisabled}
              className={EXPENSE_SHEET_FIELD_CELL_CLASS}
              onValueChange={(v) => patchDraft({ billingDay: v })}
            />
          </div>
          {draft.billingFrequency === 'CUSTOM' ? (
            <div className={EXPENSE_SHEET_FIELD_ROW_2_CLASS}>
              <InlineField
                variant="controlled"
                label="Coverage"
                type="number"
                value={draft.coverageMonthCount}
                placeholder={`${CUSTOM_PREPAID_MONTH_MIN}–${CUSTOM_PREPAID_MONTH_MAX}`}
                icon={<Repeat size={12} />}
                disabled={formDisabled}
                className={EXPENSE_SHEET_FIELD_CELL_CLASS}
                onValueChange={onCoverageMonthCountChange}
              />
            </div>
          ) : null}
          <div className={EXPENSE_SHEET_FIELD_ROW_2_CLASS}>
            <InlineField
              variant="controlled"
              label="Started"
              type="date"
              value={draft.billingStartDate}
              icon={<Calendar size={12} />}
              disabled={formDisabled}
              className={EXPENSE_SHEET_FIELD_CELL_CLASS}
              onValueChange={(v) => patchDraft({ billingStartDate: v })}
            />
            <InlineField
              variant="controlled"
              label="End"
              type="date"
              value={draft.endDate}
              clearable
              icon={<Calendar size={12} />}
              disabled={formDisabled}
              className={EXPENSE_SHEET_FIELD_CELL_CLASS}
              onValueChange={(v) => patchDraft({ endDate: v })}
            />
          </div>
          {billingValidationError ? (
            <p className="text-destructive text-sm">{billingValidationError}</p>
          ) : null}
          <SubscriptionTermSummary subscription={subscription} />
          <div className={EXPENSE_SHEET_FIELD_ROW_2_CLASS}>
            <SubscriptionNotificationSettingsRow
              notificationsEnabled={draft.notificationsEnabled}
              reminderLanguage={draft.reminderLanguage}
              disabled={formDisabled}
              onNotificationsChange={(notificationsEnabled) =>
                patchDraft({ notificationsEnabled })
              }
              onReminderLanguageChange={(reminderLanguage) => patchDraft({ reminderLanguage })}
            />
            <InlineField
              variant="controlled"
              label="Partner"
              type="select"
              value={draft.partnerId}
              options={partnerSelectOptions}
              icon={<Handshake size={12} />}
              clearable
              disabled={formDisabled}
              className={EXPENSE_SHEET_FIELD_CELL_CLASS}
              onValueChange={onPartnerChange}
            />
          </div>
        </div>
      </DetailSheetCollapsibleSection>

      <SubscriptionDetailLinkedPanel subscription={subscription} />
    </div>
  );
}
