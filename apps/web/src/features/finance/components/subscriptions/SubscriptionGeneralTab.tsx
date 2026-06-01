'use client';

import { useCallback, useEffect, useState } from 'react';
import { Calendar, DollarSign, Handshake, Layers, Receipt, Repeat } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DETAIL_SHEET_SECTION_STRETCH_CLASS,
  DetailSheetCollapsibleSection,
  InlineField,
} from '@/components/shared';
import { TAX_STATUSES } from '@/features/finance/components/expenses/edit-expense-dialog-constants';
import {
  SUBSCRIPTION_BILLING_FREQUENCIES,
  SUBSCRIPTION_TYPES,
} from '@/features/finance/constants/finance';
import type { SubscriptionGeneralDraft } from '@/features/finance/utils/subscription-general-form-state';
import { partnersApi } from '@/lib/api/partners';
import { SubscriptionDetailActions } from './SubscriptionDetailActions';
import { SubscriptionDetailLinkedPanel } from './SubscriptionDetailLinkedPanel';
import type { Subscription } from '@/lib/api/finance';

interface SubscriptionGeneralTabProps {
  subscription: Subscription;
  draft: SubscriptionGeneralDraft;
  patchDraft: (partial: Partial<SubscriptionGeneralDraft>) => void;
  formDisabled?: boolean;
  onSubscriptionChange: (updated: Subscription) => void;
  onActionError: (message: string | null) => void;
}

export function SubscriptionGeneralTab({
  subscription,
  draft,
  patchDraft,
  formDisabled = false,
  onSubscriptionChange,
  onActionError,
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
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,52rem)_minmax(0,1fr)_auto] xl:items-start xl:gap-6">
      <div className="flex max-w-[52rem] min-w-0 flex-col gap-4">
        <DetailSheetCollapsibleSection
          title="Billing"
          icon={<DollarSign size={12} />}
          open={billingOpen}
          onOpenChange={setBillingOpen}
        >
          <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
            <InlineField
              variant="controlled"
              label="Type"
              type="select"
              value={draft.type}
              options={SUBSCRIPTION_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              icon={<Layers size={12} />}
              disabled={formDisabled}
              onValueChange={(v) => v && patchDraft({ type: v })}
            />
            <InlineField
              variant="controlled"
              label="Amount / month"
              type="money"
              value={draft.baseMonthlyAmount}
              placeholder="Enter amount…"
              icon={<DollarSign size={12} />}
              disabled={formDisabled}
              onValueChange={(v) => patchDraft({ baseMonthlyAmount: v })}
            />
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
              onValueChange={(v) => v && patchDraft({ billingFrequency: v })}
            />
            <InlineField
              variant="controlled"
              label="Billing day"
              type="number"
              value={draft.billingDay}
              placeholder="1–28"
              icon={<Calendar size={12} />}
              disabled={formDisabled}
              onValueChange={(v) => patchDraft({ billingDay: v })}
            />
            <InlineField
              variant="controlled"
              label="Tax"
              type="select"
              value={draft.taxStatus}
              options={TAX_STATUSES.map((t) => ({ value: t.value, label: t.label }))}
              icon={<Receipt size={12} />}
              disabled={formDisabled}
              onValueChange={(v) => v && patchDraft({ taxStatus: v })}
            />
            <InlineField
              variant="controlled"
              label="Started"
              type="date"
              value={draft.billingStartDate}
              icon={<Calendar size={12} />}
              disabled={formDisabled}
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
              onValueChange={(v) => patchDraft({ endDate: v })}
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
              onValueChange={onPartnerChange}
            />
            <label className="text-muted-foreground flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={draft.notificationsEnabled}
                disabled={formDisabled}
                onCheckedChange={(checked) =>
                  patchDraft({ notificationsEnabled: checked === true })
                }
              />
              Billing notifications
            </label>
          </div>
        </DetailSheetCollapsibleSection>
      </div>

      <div aria-hidden className="hidden min-h-0 xl:block" />

      <aside
        className={`flex w-64 shrink-0 flex-col gap-4 xl:w-72 ${DETAIL_SHEET_SECTION_STRETCH_CLASS}`}
      >
        <SubscriptionDetailActions
          subscription={subscription}
          onSubscriptionChange={onSubscriptionChange}
          onError={onActionError}
        />
        <SubscriptionDetailLinkedPanel subscription={subscription} />
      </aside>
    </div>
  );
}
