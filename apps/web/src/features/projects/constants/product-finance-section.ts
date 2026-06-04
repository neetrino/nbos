import { Globe, Receipt, RefreshCw, ShoppingCart, type LucideIcon } from 'lucide-react';
import type { PageHeroTabOption } from '@/components/shared/page-hero/PageHeroTabs';

export const PRODUCT_FINANCE_SECTION_QUERY = 'financeSection';

export const PRODUCT_FINANCE_SECTION_VALUES = [
  'orders',
  'subscriptions',
  'expenses',
  'domains',
] as const;

export type ProductFinanceSection = (typeof PRODUCT_FINANCE_SECTION_VALUES)[number];

export const PRODUCT_FINANCE_SECTION_DEFAULT: ProductFinanceSection = 'orders';

const SECTION_ICON: Record<ProductFinanceSection, LucideIcon> = {
  orders: ShoppingCart,
  subscriptions: RefreshCw,
  expenses: Receipt,
  domains: Globe,
};

export const PRODUCT_FINANCE_SECTION_OPTIONS: PageHeroTabOption<ProductFinanceSection>[] =
  PRODUCT_FINANCE_SECTION_VALUES.map((value) => ({
    value,
    label: value.charAt(0).toUpperCase() + value.slice(1),
    icon: SECTION_ICON[value],
  }));

export function parseProductFinanceSection(value: string | null): ProductFinanceSection {
  if (value && PRODUCT_FINANCE_SECTION_VALUES.includes(value as ProductFinanceSection)) {
    return value as ProductFinanceSection;
  }
  return PRODUCT_FINANCE_SECTION_DEFAULT;
}
