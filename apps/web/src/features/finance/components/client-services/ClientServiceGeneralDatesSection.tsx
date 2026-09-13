'use client';

import { useState } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DetailSheetCollapsibleSection,
  InlineField,
} from '@/components/shared';
import {
  EXPENSE_SHEET_FIELD_CELL_CLASS,
  EXPENSE_SHEET_FIELD_ROW_2_CLASS,
} from '@/features/finance/components/expenses/edit-expense-dialog-constants';
import { SubscriptionNotificationSettingsRow } from '@/features/finance/components/subscriptions/SubscriptionNotificationSettingsRow';
import { isClientServiceDomain } from '@/features/finance/constants/client-service-registry';
import type { ClientServiceFormState } from '@/features/finance/utils/client-service-form-state';
import type {
  ClientServiceRecord,
  ClientServiceRegistryCheckResult,
} from '@/lib/api/client-services';
import { ClientServiceRegistryBadge } from './ClientServiceRegistryBadge';
import { ClientServiceRegistryCheckButton } from './ClientServiceRegistryCheckButton';
import { useClientServicesT } from './client-service-message-keys';
import { useLocale } from 'next-intl';

const DATES_ROW_WITH_CHECK_CLASS =
  'grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-3';

export function ClientServiceGeneralDatesSection(props: {
  service: ClientServiceRecord;
  draft: ClientServiceFormState;
  patchDraft: (partial: Partial<ClientServiceFormState>) => void;
  formDisabled: boolean;
  onRegistryChecked?: (result: ClientServiceRegistryCheckResult) => void;
}) {
  const t = useClientServicesT();
  const locale = useLocale();
  const [open, setOpen] = useState(true);
  const { draft, patchDraft, formDisabled, service } = props;
  const isDomain = isClientServiceDomain(service);
  const checkedLabel = formatRegistryCheckedAt(service.registryCheckedAt, locale);

  return (
    <DetailSheetCollapsibleSection
      title={t('sheet.dates')}
      icon={<Calendar size={12} />}
      open={open}
      onOpenChange={setOpen}
    >
      <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
        <ClientServiceDateFieldsRow
          draft={draft}
          patchDraft={patchDraft}
          formDisabled={formDisabled}
          isDomain={isDomain}
          serviceId={service.id}
          onRegistryChecked={props.onRegistryChecked}
        />
        {isDomain ? (
          <div className="flex flex-wrap items-center gap-2">
            <ClientServiceRegistryBadge status={service.registryLookupStatus} />
            {checkedLabel ? (
              <p className="text-muted-foreground text-xs">
                {service.registryLookupSource
                  ? t('registry.lastCheckedSource', {
                      date: checkedLabel,
                      source: service.registryLookupSource,
                    })
                  : t('registry.lastChecked', { date: checkedLabel })}
              </p>
            ) : null}
          </div>
        ) : null}
        <div className={EXPENSE_SHEET_FIELD_ROW_2_CLASS}>
          <SubscriptionNotificationSettingsRow
            notificationsEnabled={draft.notificationsEnabled}
            reminderLanguage={draft.reminderLanguage}
            disabled={formDisabled}
            onNotificationsChange={(notificationsEnabled) => patchDraft({ notificationsEnabled })}
            onReminderLanguageChange={(reminderLanguage) => patchDraft({ reminderLanguage })}
          />
        </div>
      </div>
    </DetailSheetCollapsibleSection>
  );
}

function ClientServiceDateFieldsRow(props: {
  draft: ClientServiceFormState;
  patchDraft: (partial: Partial<ClientServiceFormState>) => void;
  formDisabled: boolean;
  isDomain: boolean;
  serviceId: string;
  onRegistryChecked?: (result: ClientServiceRegistryCheckResult) => void;
}) {
  const t = useClientServicesT();
  return (
    <div className={props.isDomain ? DATES_ROW_WITH_CHECK_CLASS : EXPENSE_SHEET_FIELD_ROW_2_CLASS}>
      <InlineField
        variant="controlled"
        label={t('fields.startDate')}
        type="date"
        value={props.draft.startDate}
        icon={<Calendar size={12} />}
        disabled={props.formDisabled}
        className={EXPENSE_SHEET_FIELD_CELL_CLASS}
        onValueChange={(startDate) => props.patchDraft({ startDate })}
      />
      <InlineField
        variant="controlled"
        label={t('fields.renewalDate')}
        type="date"
        value={props.draft.renewalDate}
        icon={<RefreshCw size={12} />}
        disabled={props.formDisabled}
        datePickerAlwaysShowYear
        className={EXPENSE_SHEET_FIELD_CELL_CLASS}
        onValueChange={(renewalDate) => props.patchDraft({ renewalDate })}
      />
      {props.isDomain ? (
        <ClientServiceRegistryCheckButton
          serviceId={props.serviceId}
          matchFieldHeight
          disabled={props.formDisabled}
          onChecked={props.onRegistryChecked}
        />
      ) : null}
    </div>
  );
}

function formatRegistryCheckedAt(value: string | null | undefined, locale?: string): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat(locale ?? 'en', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
