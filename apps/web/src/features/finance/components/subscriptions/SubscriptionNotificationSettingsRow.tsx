'use client';

import { SegmentedTabs } from '@/components/shared';
import {
  DETAIL_SHEET_OUTLINED_FIELD_SHELL_CLASS,
  DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
  DETAIL_SHEET_OUTLINED_LABEL_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { Switch } from '@/components/ui/switch';
import {
  DEFAULT_SUBSCRIPTION_REMINDER_LANGUAGE,
  SUBSCRIPTION_REMINDER_LANGUAGE_SHORT_OPTIONS,
} from '@/features/finance/constants/finance';
import { cn } from '@/lib/utils';

interface SubscriptionNotificationSettingsRowProps {
  notificationsEnabled: boolean;
  reminderLanguage: string;
  disabled?: boolean;
  onNotificationsChange: (enabled: boolean) => void;
  onReminderLanguageChange: (language: string) => void;
}

export function SubscriptionNotificationSettingsRow({
  notificationsEnabled,
  reminderLanguage,
  disabled = false,
  onNotificationsChange,
  onReminderLanguageChange,
}: SubscriptionNotificationSettingsRowProps) {
  const languageValue = SUBSCRIPTION_REMINDER_LANGUAGE_SHORT_OPTIONS.some(
    (option) => option.value === reminderLanguage,
  )
    ? reminderLanguage
    : DEFAULT_SUBSCRIPTION_REMINDER_LANGUAGE;

  return (
    <div
      className={cn(
        DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
        disabled && 'pointer-events-none opacity-60',
      )}
    >
      <span className={DETAIL_SHEET_OUTLINED_LABEL_CLASS}>Notification</span>
      <div className={cn(DETAIL_SHEET_OUTLINED_FIELD_SHELL_CLASS, 'gap-2 pr-1.5')}>
        <Switch
          size="lg"
          checked={notificationsEnabled}
          disabled={disabled}
          aria-label="Notification"
          onCheckedChange={(checked) => onNotificationsChange(Boolean(checked))}
        />
        <div className={cn('ml-auto', !notificationsEnabled && 'invisible')}>
          <SegmentedTabs
            value={languageValue}
            options={SUBSCRIPTION_REMINDER_LANGUAGE_SHORT_OPTIONS}
            ariaLabel="Language"
            listClassName="bg-background rounded-full p-0.5"
            pillClassName="rounded-full"
            buttonClassName="min-w-[2.25rem] rounded-full px-2.5 py-1 text-xs font-semibold lowercase tracking-wide"
            onChange={onReminderLanguageChange}
          />
        </div>
      </div>
    </div>
  );
}
