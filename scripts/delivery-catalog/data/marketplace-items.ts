import type { CatalogSeedItem } from './catalog-seed-types';

/** Extra modules of a marketplace. The storefront itself is the marketplace core. */
export const MARKETPLACE_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'MKT_SELLER_CABINET',
    category: 'commerce',
    iconKey: 'Store',
    title: 'Seller cabinet',
    summary: 'A seller workspace for listings, orders, and payouts.',
    scopeBoundaries:
      'Seller profile, listing management, order handling, and basic payout status. Commission rules are a separate card.',
    units: { BACKEND: 28, FRONTEND: 22, PM: 4, DESIGNER: 6, QA: 7 },
  },
  {
    code: 'MKT_COMMISSIONS',
    category: 'commerce',
    iconKey: 'Percent',
    title: 'Marketplace commissions',
    summary: 'Commission calculation on marketplace orders.',
    scopeBoundaries:
      'Commission rules, order-level calculation, seller statement, and period close. Payouts to a bank are excluded.',
    units: { BACKEND: 22, FRONTEND: 10, PM: 3, QA: 5 },
  },
  {
    code: 'MKT_LISTING_MODERATION',
    category: 'commerce',
    iconKey: 'Shield',
    title: 'Listing moderation',
    summary: 'Review and approval of seller listings.',
    scopeBoundaries: 'Moderation queue, approve and reject, reasons, and listing status history.',
    units: { BACKEND: 16, FRONTEND: 12, PM: 3, DESIGNER: 3, QA: 4 },
  },
];
