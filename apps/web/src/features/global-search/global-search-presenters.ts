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
