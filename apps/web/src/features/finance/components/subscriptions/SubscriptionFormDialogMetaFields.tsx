'use client';

import { NbosDatePicker } from '@/components/shared/date-picker';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SUBSCRIPTION_REMINDER_LANGUAGES } from '@/features/finance/constants/finance';
import type { Partner } from '@/lib/api/partners';
import type { SubscriptionFormState } from '@/features/finance/utils/subscription-form-state';

interface SubscriptionFormDialogMetaFieldsProps {
  form: SubscriptionFormState;
  partners: Partner[];
  optionsLoading: boolean;
  onFormChange: (partial: Partial<SubscriptionFormState>) => void;
}

function normalizeSelectValue(value: string | null): string {
  return value ?? '';
}

export function SubscriptionFormDialogMetaFields({
  form,
  partners,
  optionsLoading,
  onFormChange,
}: SubscriptionFormDialogMetaFieldsProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sub-start">Billing start date</Label>
          <NbosDatePicker
            id="sub-start"
            value={form.billingStartDate}
            onChange={(billingStartDate) => onFormChange({ billingStartDate })}
            aria-label="Billing start date"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sub-end">End date (optional)</Label>
          <NbosDatePicker
            id="sub-end"
            value={form.endDate}
            onChange={(endDate) => onFormChange({ endDate })}
            clearable
            aria-label="End date"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sub-partner">Partner (optional)</Label>
        <Select
          value={form.partnerId || 'NONE'}
          onValueChange={(v) => {
            const nextValue = normalizeSelectValue(v);
            onFormChange({ partnerId: nextValue === 'NONE' ? '' : nextValue });
          }}
          disabled={optionsLoading}
        >
          <SelectTrigger id="sub-partner">
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NONE">None</SelectItem>
            {partners.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sub-reminder-language">Payment reminder language</Label>
        <Select
          value={form.reminderLanguage}
          onValueChange={(v) => onFormChange({ reminderLanguage: normalizeSelectValue(v) })}
        >
          <SelectTrigger id="sub-reminder-language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUBSCRIPTION_REMINDER_LANGUAGES.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="sub-notifications"
          checked={form.notificationsEnabled}
          onCheckedChange={(checked) => onFormChange({ notificationsEnabled: checked === true })}
        />
        <Label htmlFor="sub-notifications" className="font-normal">
          Enable billing notifications for this subscription
        </Label>
      </div>
    </>
  );
}
