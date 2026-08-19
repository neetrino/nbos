import type { LucideIcon } from 'lucide-react';
import {
  FileText,
  Handshake,
  KeyRound,
  Package,
  Receipt,
  RefreshCw,
  ShoppingCart,
  Target,
  Wallet,
} from 'lucide-react';
import type { SearchEntityType } from '@/lib/api/search';

export const GLOBAL_SEARCH_ENTITY_ICONS: Record<SearchEntityType, LucideIcon> = {
  lead: Target,
  deal: Handshake,
  product: Package,
  invoice: FileText,
  payment: Wallet,
  order: ShoppingCart,
  subscription: RefreshCw,
  expense: Receipt,
  credential: KeyRound,
};

/** Module/entity palette aligned with sidebar + entity sheets. */
export const GLOBAL_SEARCH_ENTITY_VISUALS: Record<
  SearchEntityType,
  { iconClass: string; tileClass: string }
> = {
  lead: {
    iconClass: 'text-sky-600 dark:text-sky-400',
    tileClass: 'bg-sky-500/10',
  },
  deal: {
    iconClass: 'text-blue-600 dark:text-blue-400',
    tileClass: 'bg-blue-500/10',
  },
  product: {
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    tileClass: 'bg-emerald-500/10',
  },
  invoice: {
    iconClass: 'text-sky-600 dark:text-sky-400',
    tileClass: 'bg-sky-500/10',
  },
  payment: {
    iconClass: 'text-green-600 dark:text-green-400',
    tileClass: 'bg-green-500/10',
  },
  order: {
    iconClass: 'text-green-600 dark:text-green-400',
    tileClass: 'bg-green-500/10',
  },
  subscription: {
    iconClass: 'text-violet-600 dark:text-violet-400',
    tileClass: 'bg-violet-500/10',
  },
  expense: {
    iconClass: 'text-orange-600 dark:text-orange-400',
    tileClass: 'bg-orange-500/10',
  },
  credential: {
    iconClass: 'text-rose-700 dark:text-rose-300',
    tileClass: 'bg-rose-700/10',
  },
};

export function formatGlobalSearchDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}
