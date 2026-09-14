'use client';

import { useTranslations } from 'next-intl';
import {
  DetailSheetFormFooter,
  DetailSheetSection,
  InlineField,
  StatusBadge,
} from '@/components/shared';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ExpensePlan } from '@/lib/api/expense-plans';
import type { MarketingAccount } from '@/lib/api/marketing';
import { MARKETING_ACCOUNT_STATUSES, getMarketingLabel } from '@/features/marketing/constants';
import {
  getMarketingAccountStatusVariant,
  marketingAccountUsesPhone,
} from '@/features/marketing/constants/marketing-settings-surface';
import type { MarketingAccountDraft } from '@/features/marketing/utils/build-marketing-account-draft';
import { MarketingAccountExpensePlanLink } from '@/features/marketing/components/MarketingAccountExpensePlanLink';

interface MarketingAccountSheetBodyProps {
  account: MarketingAccount;
  draft: MarketingAccountDraft;
  snap: MarketingAccountDraft;
  dirty: boolean;
  canEdit: boolean;
  saving: boolean;
  errorMessage: string | null;
  expensePlans: ExpensePlan[];
  plansLoading: boolean;
  onDraftChange: (draft: MarketingAccountDraft) => void;
  onSave: () => void;
}

export function MarketingAccountSheetBody(props: MarketingAccountSheetBodyProps) {
  const patchDraft = (partial: Partial<MarketingAccountDraft>) =>
    props.onDraftChange({ ...props.draft, ...partial });

  return (
    <>
      <MarketingAccountSheetHeader
        channel={props.account.channel}
        displayName={props.draft.name || props.account.name}
        status={props.draft.status}
      />
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-5 px-7 py-5 max-md:px-4">
          <MarketingAccountGeneralFields
            channel={props.account.channel}
            draft={props.draft}
            disabled={!props.canEdit || props.saving}
            onPatch={patchDraft}
          />
          <MarketingAccountFinanceFields
            channel={props.account.channel}
            draft={props.draft}
            expensePlans={props.expensePlans}
            plansLoading={props.plansLoading}
            disabled={!props.canEdit || props.saving}
            onPatch={patchDraft}
          />
        </div>
      </ScrollArea>
      <DetailSheetFormFooter
        visible={props.canEdit}
        dirty={props.dirty}
        saving={props.saving}
        errorMessage={props.errorMessage}
        onCancel={() => props.onDraftChange({ ...props.snap })}
        onSave={props.onSave}
      />
    </>
  );
}

function MarketingAccountSheetHeader({
  channel,
  displayName,
  status,
}: {
  channel: string;
  displayName: string;
  status: string;
}) {
  const t = useTranslations('marketing');
  return (
    <div className="bg-background shrink-0 px-7 pt-5 pb-3 max-md:px-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-foreground truncate text-xl font-bold tracking-tight">
            {displayName}
          </h2>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {getMarketingLabel('channels', channel, t)}
          </p>
        </div>
        <StatusBadge
          label={getMarketingLabel('accountStatus', status, t)}
          variant={getMarketingAccountStatusVariant(status)}
          className="rounded-full"
        />
      </div>
    </div>
  );
}

function MarketingAccountGeneralFields({
  channel,
  draft,
  disabled,
  onPatch,
}: {
  channel: string;
  draft: MarketingAccountDraft;
  disabled: boolean;
  onPatch: (partial: Partial<MarketingAccountDraft>) => void;
}) {
  const t = useTranslations('marketing');
  const statusOptions = MARKETING_ACCOUNT_STATUSES.map((status) => ({
    value: status.value,
    label: getMarketingLabel('accountStatus', status.value, t),
  }));
  const usesPhone = marketingAccountUsesPhone(channel);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <InlineField
          variant="controlled"
          label={t('settings.name')}
          value={draft.name}
          onValueChange={(name) => onPatch({ name })}
          disabled={disabled}
        />
        <InlineField
          variant="controlled"
          type="select"
          label={t('settings.status')}
          value={draft.status}
          options={statusOptions}
          onValueChange={(nextStatus) => onPatch({ status: nextStatus })}
          disabled={disabled}
        />
        <MarketingAccountSourceField
          usesPhone={usesPhone}
          draft={draft}
          disabled={disabled}
          onPatch={onPatch}
        />
      </div>
      <InlineField
        variant="controlled"
        type="textarea"
        label={t('settings.sheet.notes')}
        value={draft.notes}
        onValueChange={(notes) => onPatch({ notes })}
        disabled={disabled}
      />
    </>
  );
}

function MarketingAccountSourceField({
  usesPhone,
  draft,
  disabled,
  onPatch,
}: {
  usesPhone: boolean;
  draft: MarketingAccountDraft;
  disabled: boolean;
  onPatch: (partial: Partial<MarketingAccountDraft>) => void;
}) {
  const t = useTranslations('marketing');
  return (
    <InlineField
      variant="controlled"
      type={usesPhone ? 'phone' : 'text'}
      label={usesPhone ? t('settings.phone') : t('settings.identifier')}
      value={usesPhone ? draft.phone : draft.identifier}
      placeholder={usesPhone ? t('settings.phonePlaceholder') : t('settings.identifierPlaceholder')}
      onValueChange={(value) => onPatch(usesPhone ? { phone: value } : { identifier: value })}
      disabled={disabled}
    />
  );
}

function MarketingAccountFinanceFields({
  channel,
  draft,
  expensePlans,
  plansLoading,
  disabled,
  onPatch,
}: {
  channel: string;
  draft: MarketingAccountDraft;
  expensePlans: ExpensePlan[];
  plansLoading: boolean;
  disabled: boolean;
  onPatch: (partial: Partial<MarketingAccountDraft>) => void;
}) {
  const t = useTranslations('marketing');
  return (
    <DetailSheetSection title={t('settings.sheet.financeSection')}>
      <p className="text-muted-foreground mb-3 text-sm">{t('settings.noFinanceLinkHint')}</p>
      <MarketingAccountExpensePlanLink
        channel={channel}
        expensePlans={expensePlans}
        selectedPlanId={draft.financeExpensePlanId}
        onSelectedPlanIdChange={(financeExpensePlanId) => onPatch({ financeExpensePlanId })}
        plansLoading={plansLoading}
        disabled={disabled}
      />
    </DetailSheetSection>
  );
}
