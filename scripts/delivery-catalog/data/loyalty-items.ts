import type { CatalogSeedItem } from './catalog-seed-types';

/** Лояльность. Программы, где деньги клиента и его поведение превращаются в скидку или баллы. */
export const LOYALTY_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'LOY_BONUS_POINTS',
    category: 'loyalty',
    iconKey: 'Star',
    title: 'Loyalty points',
    summary: 'Earning and redeeming points for purchases.',
    scopeBoundaries:
      'Earning rules, redemption at checkout, point expiration, transaction history, and product restrictions.',
    units: { BACKEND: 22, FRONTEND: 10, PM: 3, DESIGNER: 2, QA: 5 },
  },
  {
    code: 'LOY_DISCOUNT_COUPONS',
    category: 'loyalty',
    iconKey: 'Ticket',
    title: 'Promo codes and coupons',
    summary: 'Discount codes with conditions and limits.',
    scopeBoundaries:
      'Code generation, application conditions and limits, expiration, compatibility with other discounts, and usage reporting.',
    units: { BACKEND: 14, FRONTEND: 6, PM: 2, QA: 4 },
  },
  {
    code: 'LOY_CUSTOMER_WALLET',
    category: 'loyalty',
    iconKey: 'Wallet',
    title: 'Customer wallet',
    summary: 'Internal customer balance with transaction history.',
    scopeBoundaries:
      'Top-ups and deductions, history, balance payments, balance refunds, and reconciliation. External withdrawals are excluded.',
    units: { BACKEND: 26, FRONTEND: 12, PM: 4, QA: 6 },
  },
  {
    code: 'LOY_REFERRAL_PROGRAM',
    category: 'loyalty',
    iconKey: 'Network',
    title: 'Referral program',
    summary: 'Rewarded invitations for friends.',
    scopeBoundaries:
      'Personal links and codes, reward conditions, fraud protection, and referrer statistics.',
    units: { BACKEND: 20, FRONTEND: 10, PM: 3, DESIGNER: 2, QA: 5 },
  },
  {
    code: 'LOY_TIERS',
    category: 'loyalty',
    iconKey: 'TrendingUp',
    title: 'Loyalty tiers',
    summary: 'Customer statuses with different benefits.',
    scopeBoundaries:
      'Tier transition rules, tier benefits, recalculation after refunds, and customer-facing status.',
    units: { BACKEND: 18, FRONTEND: 8, PM: 3, DESIGNER: 2, QA: 4 },
  },
  {
    code: 'LOY_GIFT_CARDS',
    category: 'loyalty',
    iconKey: 'Gift',
    title: 'Gift cards',
    summary: 'Gift card sales and redemption.',
    scopeBoundaries:
      'Issuance and denominations, card code, partial redemption, expiration, and authenticity validation.',
    units: { BACKEND: 18, FRONTEND: 8, PM: 2, DESIGNER: 2, QA: 4 },
  },
  {
    code: 'LOY_LOYALTY_CARD',
    category: 'loyalty',
    iconKey: 'QrCode',
    title: 'Scannable loyalty card',
    summary: 'An electronic customer card with scanning.',
    scopeBoundaries:
      'Code generation, display in the portal or app, point-of-sale scanning, and purchase linkage.',
    units: { BACKEND: 12, FRONTEND: 8, PM: 2, DESIGNER: 2, QA: 3, TECHNICAL_SPECIALIST: 1 },
  },
  {
    code: 'LOY_BIRTHDAY_CAMPAIGNS',
    category: 'loyalty',
    iconKey: 'CalendarCheck',
    title: 'Event-triggered campaigns',
    summary: 'Offers for birthdays and other events.',
    scopeBoundaries:
      'Event triggers, offer template, delivery through a connected channel, frequency limits, and reporting.',
    units: { BACKEND: 14, FRONTEND: 5, PM: 2, QA: 3 },
  },
  {
    code: 'LOY_CUSTOMER_SEGMENTS',
    category: 'loyalty',
    iconKey: 'Users',
    title: 'Customer segments',
    summary: 'Customer grouping by behavior and purchases.',
    scopeBoundaries:
      'Segment conditions, membership recalculation, campaign and discount use, and segment export.',
    units: { BACKEND: 20, FRONTEND: 8, PM: 3, QA: 5 },
  },
] as const;
