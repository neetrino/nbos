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
        <div className={EXPENSE_SHEET_FIELD_ROW_2_CLASS}>
          <InlineField
            variant="controlled"
            label="Start date"
            type="date"
            value={draft.startDate}
            icon={<Calendar size={12} />}
            disabled={formDisabled}
            className={EXPENSE_SHEET_FIELD_CELL_CLASS}
            onValueChange={(startDate) => patchDraft({ startDate })}
          />
          <InlineField
            variant="controlled"
            label="Renewal date"
            type="date"
            value={draft.renewalDate}
            icon={<RefreshCw size={12} />}
            disabled={formDisabled}
            className={EXPENSE_SHEET_FIELD_CELL_CLASS}
            onValueChange={(renewalDate) => patchDraft({ renewalDate })}
          />
        </div>
        {isDomain ? (
          <div className="flex flex-wrap items-center gap-2">
            <ClientServiceRegistryCheckButton
              serviceId={service.id}
              disabled={formDisabled}
              onChecked={props.onRegistryChecked}
            />
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
