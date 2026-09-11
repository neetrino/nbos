'use client';

import { BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';

const OVERDUE_REMIND_LABEL = 'Remind';
const OVERDUE_REMIND_ACTION_NAME = 'Send overdue reminders';

const OVERDUE_REMIND_BUTTON_CLASS =
  'border-amber-300/90 bg-amber-50 text-amber-800 hover:border-amber-400 hover:bg-amber-100 hover:text-amber-950 dark:border-amber-800 dark:bg-amber-950/45 dark:text-amber-200 dark:hover:border-amber-700 dark:hover:bg-amber-950/70';

interface OverdueRemindersButtonProps {
  onClick: () => void;
}

export function OverdueRemindersButton({ onClick }: OverdueRemindersButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      aria-label={OVERDUE_REMIND_ACTION_NAME}
      title={OVERDUE_REMIND_ACTION_NAME}
      className={OVERDUE_REMIND_BUTTON_CLASS}
    >
      <BellRing aria-hidden />
      {OVERDUE_REMIND_LABEL}
    </Button>
  );
}
