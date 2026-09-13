'use client';

import { BellRing } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

const OVERDUE_REMIND_BUTTON_CLASS =
  'border-amber-300/90 bg-amber-50 text-amber-800 hover:border-amber-400 hover:bg-amber-100 hover:text-amber-950 dark:border-amber-800 dark:bg-amber-950/45 dark:text-amber-200 dark:hover:border-amber-700 dark:hover:bg-amber-950/70';

interface OverdueRemindersButtonProps {
  onClick: () => void;
}

export function OverdueRemindersButton({ onClick }: OverdueRemindersButtonProps) {
  const t = useTranslations('invoices');
  const action = t('reminders.action');
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      aria-label={action}
      title={action}
      className={OVERDUE_REMIND_BUTTON_CLASS}
    >
      <BellRing aria-hidden />
      {t('reminders.button')}
    </Button>
  );
}
