import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  CircleHelp,
  Gift,
  Globe,
  GraduationCap,
  Handshake,
  HardDrive,
  Landmark,
  Network,
  Receipt,
  Server,
  Sparkles,
  UserRound,
  Wrench,
} from 'lucide-react';
import { EXPENSE_CATEGORIES } from '@/features/finance/constants/finance';

type ExpenseCategoryVisual = {
  icon: LucideIcon;
  iconShellClassName: string;
};

const DEFAULT_VISUAL: ExpenseCategoryVisual = {
  icon: CircleHelp,
  iconShellClassName: 'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300',
};

const EXPENSE_CATEGORY_VISUAL: Record<string, ExpenseCategoryVisual> = {
  DOMAIN: {
    icon: Globe,
    iconShellClassName: 'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300',
  },
  HOSTING: {
    icon: HardDrive,
    iconShellClassName: 'bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300',
  },
  SERVICE: {
    icon: Server,
    iconShellClassName: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300',
  },
  MARKETING: {
    icon: Sparkles,
    iconShellClassName: 'bg-pink-100 text-pink-600 dark:bg-pink-950/40 dark:text-pink-300',
  },
  SALARY: {
    icon: UserRound,
    iconShellClassName:
      'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  BONUS: {
    icon: Gift,
    iconShellClassName: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300',
  },
  PARTNER_PAYOUT: {
    icon: Handshake,
    iconShellClassName: 'bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300',
  },
  TOOLS: {
    icon: Wrench,
    iconShellClassName: 'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-300',
  },
  OFFICE: {
    icon: Building2,
    iconShellClassName: 'bg-teal-100 text-teal-600 dark:bg-teal-950/40 dark:text-teal-300',
  },
  TAXES: {
    icon: Landmark,
    iconShellClassName: 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300',
  },
  BANK_FEES: {
    icon: Receipt,
    iconShellClassName: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-300',
  },
  TRAINING: {
    icon: GraduationCap,
    iconShellClassName: 'bg-lime-100 text-lime-700 dark:bg-lime-950/40 dark:text-lime-300',
  },
  INTERNAL_INFRA: {
    icon: Network,
    iconShellClassName:
      'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-950/40 dark:text-fuchsia-300',
  },
  OTHER: DEFAULT_VISUAL,
};

/** Icon + tinted shell for expense category on Pay Now board cards. */
export function getExpenseCategoryVisual(category: string): ExpenseCategoryVisual {
  return EXPENSE_CATEGORY_VISUAL[category] ?? DEFAULT_VISUAL;
}

/** Human label for category enum (falls back to raw value). */
export function getExpenseCategoryLabel(category: string): string {
  return EXPENSE_CATEGORIES.find((item) => item.value === category)?.label ?? category;
}
