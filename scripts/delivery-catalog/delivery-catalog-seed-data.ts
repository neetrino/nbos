import { ACCOUNTS_ITEMS } from './data/accounts-items';
import { AI_ITEMS } from './data/ai-items';
import { ANALYTICS_ITEMS } from './data/analytics-items';
import { BOOKING_ITEMS } from './data/booking-items';
import { COMMERCE_ITEMS } from './data/commerce-items';
import { CONTENT_ITEMS } from './data/content-items';
import { CRM_OPS_ITEMS } from './data/crm-ops-items';
import { DESKTOP_ITEMS } from './data/desktop-items';
import { FINANCE_OPS_ITEMS } from './data/finance-ops-items';
import { HR_OPS_ITEMS } from './data/hr-ops-items';
import { INTEGRATIONS_ITEMS } from './data/integrations-items';
import { LOGISTICS_ITEMS } from './data/logistics-items';
import { LOYALTY_ITEMS } from './data/loyalty-items';
import { MESSAGING_ITEMS } from './data/messaging-items';
import { MOBILE_ITEMS } from './data/mobile-items';
import { PAYMENTS_ITEMS } from './data/payments-items';
import { PLATFORM_ITEMS } from './data/platform-items';
import { SERVICES_ITEMS } from './data/services-items';
import type { CatalogSeedItem } from './data/catalog-seed-types';

export type { CatalogSeedItem } from './data/catalog-seed-types';
export { totalSeedUnits } from './data/catalog-seed-types';

/** Kept for the seed script and its tests, which predate the per-category split. */
export type DeliveryCatalogSeedItem = CatalogSeedItem;

/**
 * The whole catalog, in rail order. Units on every card are a proposal: the seed writes them as
 * DRAFT price versions, and nothing is payable until the Owner publishes them.
 */
export const DELIVERY_CATALOG_SEED_ITEMS: readonly CatalogSeedItem[] = [
  ...PAYMENTS_ITEMS,
  ...COMMERCE_ITEMS,
  ...LOGISTICS_ITEMS,
  ...MESSAGING_ITEMS,
  ...ACCOUNTS_ITEMS,
  ...CONTENT_ITEMS,
  ...LOYALTY_ITEMS,
  ...BOOKING_ITEMS,
  ...CRM_OPS_ITEMS,
  ...FINANCE_OPS_ITEMS,
  ...HR_OPS_ITEMS,
  ...ANALYTICS_ITEMS,
  ...AI_ITEMS,
  ...INTEGRATIONS_ITEMS,
  ...PLATFORM_ITEMS,
  ...MOBILE_ITEMS,
  ...DESKTOP_ITEMS,
  ...SERVICES_ITEMS,
];

export const SEED_INSTRUCTIONS_PLACEHOLDER =
  'The specialist documents the execution steps from actual practice before publishing the card.';

export const SEED_ACCEPTANCE_PLACEHOLDER =
  'The responsible specialist defines the acceptance criteria before publishing the card.';
