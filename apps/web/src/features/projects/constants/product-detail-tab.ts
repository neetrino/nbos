export const PRODUCT_DETAIL_TAB_QUERY = 'tab';

export const PRODUCT_DETAIL_TAB_VALUES = [
  'overview',
  'tasks',
  'extensions',
  'support',
  'technical',
  'credentials',
  'finance',
] as const;

export type ProductDetailTab = (typeof PRODUCT_DETAIL_TAB_VALUES)[number];

export const PRODUCT_DETAIL_TAB_DEFAULT: ProductDetailTab = 'overview';

/** Named tab slugs for product detail deep links (`?tab=`). */
export const PRODUCT_DETAIL_TAB = {
  overview: 'overview',
  tasks: 'tasks',
  extensions: 'extensions',
  support: 'support',
  technical: 'technical',
  credentials: 'credentials',
  finance: 'finance',
} as const satisfies Record<string, ProductDetailTab>;

const LEGACY_TAB_ALIASES: Record<string, ProductDetailTab> = {
  tickets: 'support',
};

export function parseProductDetailTab(value: string | null): ProductDetailTab {
  if (value && LEGACY_TAB_ALIASES[value]) {
    return LEGACY_TAB_ALIASES[value];
  }
  if (value && PRODUCT_DETAIL_TAB_VALUES.includes(value as ProductDetailTab)) {
    return value as ProductDetailTab;
  }
  return PRODUCT_DETAIL_TAB_DEFAULT;
}

export function buildProductDetailPageHref(
  projectId: string,
  productId: string,
  tab: ProductDetailTab = PRODUCT_DETAIL_TAB_DEFAULT,
): string {
  const base = `/projects/${projectId}/products/${productId}`;
  if (tab === PRODUCT_DETAIL_TAB_DEFAULT) return base;
  return `${base}?${PRODUCT_DETAIL_TAB_QUERY}=${tab}`;
}
