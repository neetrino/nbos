import { Receipt, RefreshCw, ServerCog, ShoppingCart, type LucideIcon } from 'lucide-react';
import type { PageHeroTabOption } from '@/components/shared/page-hero/PageHeroTabs';

export const PRODUCT_FINANCE_SECTION_QUERY = 'financeSection';

export const PRODUCT_FINANCE_SECTION_VALUES = [
  'orders',
  'subscriptions',
  'expenses',
  'client-services',
] as const;

export type ProductFinanceSection = (typeof PRODUCT_FINANCE_SECTION_VALUES)[number];

export const PRODUCT_FINANCE_SECTION_DEFAULT: ProductFinanceSection = 'orders';

const LEGACY_SECTION_ALIASES: Record<string, ProductFinanceSection> = {
  domains: 'client-services',
};

const SECTION_ICON: Record<ProductFinanceSection, LucideIcon> = {
  orders: ShoppingCart,
  subscriptions: RefreshCw,
  expenses: Receipt,
  'client-services': ServerCog,
};

const SECTION_LABEL: Record<ProductFinanceSection, string> = {
  orders: 'Orders',
  subscriptions: 'Subscriptions',
  expenses: 'Expenses',
  'client-services': 'Client services',
};

export const PRODUCT_FINANCE_SECTION_OPTIONS: PageHeroTabOption<ProductFinanceSection>[] =
  PRODUCT_FINANCE_SECTION_VALUES.map((value) => ({
    value,
    label: SECTION_LABEL[value],
    icon: SECTION_ICON[value],
  }));

export function parseProductFinanceSection(value: string | null): ProductFinanceSection {
  if (value && LEGACY_SECTION_ALIASES[value]) {
    return LEGACY_SECTION_ALIASES[value];
  }
  if (value && PRODUCT_FINANCE_SECTION_VALUES.includes(value as ProductFinanceSection)) {
    return value as ProductFinanceSection;
  }
  return PRODUCT_FINANCE_SECTION_DEFAULT;
}
