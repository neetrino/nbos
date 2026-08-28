'use client';

import { useState } from 'react';
import { Calendar, Languages, RefreshCw } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DetailSheetCollapsibleSection,
  InlineField,
} from '@/components/shared';
import { SUBSCRIPTION_REMINDER_LANGUAGES } from '@/features/finance/constants/finance';
import {
  EXPENSE_SHEET_FIELD_CELL_CLASS,
  EXPENSE_SHEET_FIELD_ROW_3_CLASS,
} from '@/features/finance/components/expenses/edit-expense-dialog-constants';
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
        <div className={EXPENSE_SHEET_FIELD_ROW_3_CLASS}>
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
          <InlineField
            variant="controlled"
            label="Reminder language"
            type="select"
            value={draft.reminderLanguage}
            options={SUBSCRIPTION_REMINDER_LANGUAGES.map((lang) => ({
              value: lang.value,
              label: lang.label,
            }))}
            icon={<Languages size={12} />}
            disabled={formDisabled}
            className={EXPENSE_SHEET_FIELD_CELL_CLASS}
            onValueChange={(reminderLanguage) =>
              reminderLanguage && patchDraft({ reminderLanguage })
            }
          />
        </div>
        <label className="flex h-10 min-w-0 items-center gap-2 text-sm">
          <Checkbox
            checked={draft.notificationsEnabled}
            disabled={formDisabled}
            onCheckedChange={(checked) => patchDraft({ notificationsEnabled: checked === true })}
          />
          Renewal notifications
        </label>
      </div>
    </DetailSheetCollapsibleSection>
  );
}
