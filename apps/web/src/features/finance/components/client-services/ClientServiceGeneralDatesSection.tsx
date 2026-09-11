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

const DATES_ROW_WITH_CHECK_CLASS =
  'grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-3';

export function ClientServiceGeneralDatesSection(props: {
  service: ClientServiceRecord;
  draft: ClientServiceFormState;
  patchDraft: (partial: Partial<ClientServiceFormState>) => void;
  formDisabled: boolean;
  onRegistryChecked?: (result: ClientServiceRegistryCheckResult) => void;
}) {
  const [open, setOpen] = useState(true);
  const { draft, patchDraft, formDisabled, service } = props;
  const isDomain = isClientServiceDomain(service);
  const checkedLabel = formatRegistryCheckedAt(service.registryCheckedAt);

  return (
    <DetailSheetCollapsibleSection
      title="Dates"
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
                Last checked {checkedLabel}
                {service.registryLookupSource ? ` · ${service.registryLookupSource}` : ''}
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
  return (
    <div className={props.isDomain ? DATES_ROW_WITH_CHECK_CLASS : EXPENSE_SHEET_FIELD_ROW_2_CLASS}>
      <InlineField
        variant="controlled"
        label="Start date"
        type="date"
        value={props.draft.startDate}
        icon={<Calendar size={12} />}
        disabled={props.formDisabled}
        className={EXPENSE_SHEET_FIELD_CELL_CLASS}
        onValueChange={(startDate) => props.patchDraft({ startDate })}
      />
      <InlineField
        variant="controlled"
        label="Renewal date"
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

function formatRegistryCheckedAt(value: string | null | undefined): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
