import type { LucideIcon } from 'lucide-react';
import { UserRound } from 'lucide-react';
import type { StatusVariant } from '@/components/shared/StatusBadge';

export interface LeadEntityPresentation {
  label: string;
  Icon: LucideIcon;
  badgeVariant: StatusVariant;
  cardShellClassName: string;
  iconWrapClassName: string;
  headerIconClassName: string;
  headerBadgeClassName: string;
}

/** Sky accent for CRM leads (kanban cards + detail sheet header). */
export const LEAD_ENTITY_VISUAL: LeadEntityPresentation = {
  label: 'Lead',
  Icon: UserRound,
  badgeVariant: 'blue',
  cardShellClassName: 'border-sky-200/90 bg-sky-50/50 dark:border-sky-900/55 dark:bg-sky-950/30',
  iconWrapClassName: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  headerIconClassName: 'text-sky-600 dark:text-sky-400',
  headerBadgeClassName:
    'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/30 dark:text-sky-300',
};
