import type { CatalogSeedItem } from './catalog-seed-types';

/**
 * Магазин и продажи. Базовая витрина, корзина и простой checkout входят в ядро магазина,
 * поэтому здесь только надстройки сверх ядра.
 */
export const COMMERCE_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'SHOP_PRODUCT_VARIANTS',
    category: 'commerce',
    iconKey: 'Boxes',
    title: 'Product variants',
    summary: 'Sizes, colors, and other variants with their own prices and stock.',
    scopeBoundaries:
      'Variant matrix, per-variant price and stock, product-page selection, and cart and order behavior.',
    units: { BACKEND: 16, FRONTEND: 8, PM: 2, DESIGNER: 2, QA: 4 },
  },
  {
    code: 'SHOP_CATALOG_FILTERS',
    category: 'commerce',
    iconKey: 'Filter',
    title: 'Catalog filters',
    summary: 'Product filtering by attributes, price, and availability.',
    scopeBoundaries:
      'Agreed attribute set, combined filters, mobile behavior, and performance at the current catalog volume.',
    units: { BACKEND: 12, FRONTEND: 10, PM: 2, DESIGNER: 2, QA: 3 },
  },
  {
    code: 'SHOP_ADVANCED_SEARCH',
    category: 'commerce',
    iconKey: 'Search',
    title: 'Advanced catalog search',
    summary: 'Search with suggestions, typo tolerance, and ranking.',
    scopeBoundaries:
      'Catalog indexing, suggestions, typo tolerance, ranking, and index updates when products change.',
    units: { BACKEND: 18, FRONTEND: 8, PM: 2, QA: 4 },
  },
  {
    code: 'SHOP_WISHLIST',
    category: 'commerce',
    iconKey: 'Heart',
    title: 'Product wishlist',
    summary: 'A customer list of saved products.',
    scopeBoundaries:
      'Adding and removing items, guest and signed-in storage, and moving items to the cart.',
    units: { BACKEND: 6, FRONTEND: 5, PM: 1, QA: 2 },
  },
  {
    code: 'SHOP_PRODUCT_COMPARE',
    category: 'commerce',
    iconKey: 'Table',
    title: 'Product comparison',
    summary: 'Comparison of attributes across multiple products.',
    scopeBoundaries: 'Product selection, attribute table, item limit, and mobile behavior.',
    units: { BACKEND: 6, FRONTEND: 7, PM: 1, DESIGNER: 2, QA: 2 },
  },
  {
    code: 'SHOP_REVIEWS',
    category: 'commerce',
    iconKey: 'Star',
    title: 'Product reviews and ratings',
    summary: 'Moderated customer reviews with ratings.',
    scopeBoundaries:
      'Review form, moderation, average rating, and spam protection. Store replies are included; threaded discussions are not.',
    units: { BACKEND: 12, FRONTEND: 7, PM: 2, DESIGNER: 2, QA: 3 },
  },
  {
    code: 'SHOP_STOCK_MANAGEMENT',
    category: 'commerce',
    iconKey: 'Warehouse',
    title: 'Inventory management',
    summary: 'Warehouse stock with reservation during ordering.',
    scopeBoundaries:
      'Stock by warehouse, order reservation, deduction at fulfillment, and out-of-stock behavior. External warehouse integration is a separate card.',
    units: { BACKEND: 20, FRONTEND: 6, PM: 3, QA: 5 },
  },
  {
    code: 'SHOP_MULTI_BRANCH',
    category: 'commerce',
    iconKey: 'Building',
    title: 'Multi-branch commerce',
    summary: 'Branch-specific prices, stock, and pickup.',
    scopeBoundaries:
      'Branch directory, per-branch prices and stock, checkout location selection, and delivery restrictions.',
    units: { BACKEND: 22, FRONTEND: 8, PM: 3, QA: 5 },
  },
  {
    code: 'SHOP_CUSTOM_CHECKOUT',
    category: 'commerce',
    iconKey: 'ShoppingCart',
    title: 'Custom checkout',
    summary: 'Order placement with custom steps and rules.',
    scopeBoundaries:
      'Differences from the base flow, extra fields and validation, payment and delivery compatibility, and mobile flow.',
    units: { BACKEND: 16, FRONTEND: 12, PM: 3, DESIGNER: 4, QA: 4 },
  },
  {
    code: 'SHOP_B2B_PRICING',
    category: 'commerce',
    iconKey: 'Briefcase',
    title: 'Wholesale and personalized pricing',
    summary: 'Prices and terms for customer groups and B2B sales.',
    scopeBoundaries:
      'Customer groups, price lists, minimum quantities, and deferred payment as an order attribute. Contract documents are excluded.',
    units: { BACKEND: 20, FRONTEND: 8, PM: 3, QA: 5 },
  },
  {
    code: 'SHOP_QUICK_ORDER',
    category: 'commerce',
    iconKey: 'Zap',
    title: 'One-step quick order',
    summary: 'Ordering by name and phone without full checkout.',
    scopeBoundaries: 'Compact form, phone validation, order creation, and manager notification.',
    units: { BACKEND: 6, FRONTEND: 5, PM: 1, DESIGNER: 1, QA: 2 },
  },
  {
    code: 'SHOP_ABANDONED_CART',
    category: 'commerce',
    iconKey: 'ShoppingCart',
    title: 'Abandoned cart reminders',
    summary: 'Reminders about an unfinished order.',
    scopeBoundaries:
      'Abandoned-cart capture, reminder rules and delay, delivery through an existing channel, and opt-out.',
    units: { BACKEND: 12, FRONTEND: 4, PM: 2, QA: 3 },
  },
  {
    code: 'SHOP_PRICE_RULES',
    category: 'commerce',
    iconKey: 'SlidersHorizontal',
    title: 'Discount and promotion rules',
    summary: 'Automatic discounts based on cart conditions.',
    scopeBoundaries:
      'Rule conditions and priority, coupon compatibility, time and product restrictions, and cart recalculation.',
    units: { BACKEND: 20, FRONTEND: 7, PM: 3, QA: 5 },
  },
  {
    code: 'SHOP_DIGITAL_GOODS',
    category: 'commerce',
    iconKey: 'Download',
    title: 'Digital product sales',
    summary: 'Delivery of files or access after payment.',
    scopeBoundaries:
      'File or access attachment to a product, post-payment delivery, link and time limits, and repeat delivery.',
    units: { BACKEND: 14, FRONTEND: 5, PM: 2, QA: 3 },
  },
  {
    code: 'SHOP_MARKETPLACE_VENDORS',
    category: 'commerce',
    iconKey: 'Store',
    title: 'Multi-vendor marketplace',
    summary: 'Isolated vendors with their own catalogs and orders.',
    scopeBoundaries:
      'Vendor, catalog, and order isolation, vendor portal, and marketplace commission. Automated vendor payouts are a separate card.',
    units: { BACKEND: 45, FRONTEND: 20, PM: 6, DESIGNER: 6, QA: 10, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'SHOP_RETURN_REQUESTS',
    category: 'commerce',
    iconKey: 'RefreshCw',
    title: 'Product return requests',
    summary: 'Customer submission and processing of returns.',
    scopeBoundaries:
      'Customer request, processing statuses, reasons, refund linkage, and notifications.',
    units: { BACKEND: 14, FRONTEND: 6, PM: 2, QA: 3 },
  },
] as const;
