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
import type { ClientServiceFormState } from '@/features/finance/utils/client-service-form-state';

export function ClientServiceGeneralDatesSection(props: {
  draft: ClientServiceFormState;
  patchDraft: (partial: Partial<ClientServiceFormState>) => void;
  formDisabled: boolean;
}) {
  const [open, setOpen] = useState(true);
  const { draft, patchDraft, formDisabled } = props;

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
