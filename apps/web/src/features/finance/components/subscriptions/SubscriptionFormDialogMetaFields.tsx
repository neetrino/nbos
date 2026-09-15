'use client';

import { Calendar, Handshake } from 'lucide-react';
import { InlineField, RelationPickerField } from '@/components/shared';
import type { RelationPickerSearchFn } from '@/components/shared/relation-picker';
import {
  EXPENSE_SHEET_FIELD_CELL_CLASS,
  EXPENSE_SHEET_FIELD_ROW_2_CLASS,
} from '@/features/finance/components/expenses/edit-expense-dialog-constants';
import type { SubscriptionFormState } from '@/features/finance/utils/subscription-form-state';
import { SubscriptionNotificationSettingsRow } from './SubscriptionNotificationSettingsRow';

interface SubscriptionFormDialogMetaFieldsProps {
  form: SubscriptionFormState;
  partnerLabel: string | null;
  searchPartners: RelationPickerSearchFn;
  partnerPicker: {
    onCreate?: (searchQuery: string) => void;
    onOpenSelected: (id: string) => void;
  };
  onFormChange: (partial: Partial<SubscriptionFormState>) => void;
  onPartnerSelect: (id: string, label: string) => void;
  onPartnerClear: () => void;
}

export function SubscriptionFormDialogMetaFields({
  form,
  partnerLabel,
  searchPartners,
  partnerPicker,
  onFormChange,
  onPartnerSelect,
  onPartnerClear,
}: SubscriptionFormDialogMetaFieldsProps) {
  return (
    <>
      <div className={EXPENSE_SHEET_FIELD_ROW_2_CLASS}>
        <InlineField
          variant="controlled"
          label="Started"
          type="date"
          value={form.billingStartDate}
          icon={<Calendar size={12} />}
          className={EXPENSE_SHEET_FIELD_CELL_CLASS}
          onValueChange={(billingStartDate) => onFormChange({ billingStartDate })}
        />
        <InlineField
          variant="controlled"
          label="End"
          type="date"
          value={form.endDate}
          clearable
          icon={<Calendar size={12} />}
          className={EXPENSE_SHEET_FIELD_CELL_CLASS}
          onValueChange={(endDate) => onFormChange({ endDate })}
        />
      </div>
      <div className={EXPENSE_SHEET_FIELD_ROW_2_CLASS}>
        <SubscriptionNotificationSettingsRow
          notificationsEnabled={form.notificationsEnabled}
          reminderLanguage={form.reminderLanguage}
          className={EXPENSE_SHEET_FIELD_CELL_CLASS}
          onNotificationsChange={(notificationsEnabled) => onFormChange({ notificationsEnabled })}
          onReminderLanguageChange={(reminderLanguage) => onFormChange({ reminderLanguage })}
        />
        <RelationPickerField
          label="Partner"
          entityKind="partner"
          value={form.partnerId || null}
          selectionLabel={partnerLabel}
          placeholder="Search partners…"
          icon={<Handshake size={12} />}
          className={EXPENSE_SHEET_FIELD_CELL_CLASS}
          onSearch={searchPartners}
          onSelect={onPartnerSelect}
          onClear={onPartnerClear}
          {...partnerPicker}
        />
      </div>
    </>
  );
}
