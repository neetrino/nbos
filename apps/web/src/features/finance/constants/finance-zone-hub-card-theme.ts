import type { LucideIcon } from 'lucide-react';

export type FinanceZoneHubCardTheme = {
  iconShell: string;
  metricValue: string;
  actionShell: string;
};

export const FINANCE_ZONE_HUB_CARD_THEMES = {
  overview: {
    iconShell: 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
    metricValue: 'text-foreground',
    actionShell:
      'bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-950/60',
  },
  revenue: {
    iconShell: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    metricValue: 'text-emerald-700 dark:text-emerald-300',
    actionShell:
      'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60',
  },
  expenses: {
    iconShell: 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300',
    metricValue: 'text-orange-700 dark:text-orange-300',
    actionShell:
      'bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-950/40 dark:text-orange-300 dark:hover:bg-orange-950/60',
  },
  payroll: {
    iconShell: 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300',
    metricValue: 'text-violet-700 dark:text-violet-300',
    actionShell:
      'bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-950/60',
  },
} as const satisfies Record<string, FinanceZoneHubCardTheme>;

export type FinanceZoneHubCardAction = {
  href: string;
  label: string;
  icon?: LucideIcon;
};
