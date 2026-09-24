import type { CatalogSeedItem } from './catalog-seed-types';
import { ARCA_BANK_ITEMS } from './payments-arca-bank-items';

/**
 * Оплаты. Каждый провайдер — отдельная карточка: работа не переиспользуется между шлюзами,
 * а клиент почти всегда выбирает конкретный банк или кошелёк.
 */
export const PAYMENTS_ITEMS: readonly CatalogSeedItem[] = [
  ...ARCA_BANK_ITEMS,
  {
    code: 'PAY_IDRAM',
    category: 'payments',
    iconKey: 'Wallet',
    title: 'Idram payments',
    summary: 'Payment acceptance through the Idram wallet.',
    scopeBoundaries:
      'Payment initiation, confirmation callback, duplicate events, successful and failed flows, and reconciliation with the provider portal.',
    units: { BACKEND: 10, FRONTEND: 3, PM: 1, QA: 2, TECHNICAL_SPECIALIST: 1 },
  },
  {
    code: 'PAY_TELCELL',
    category: 'payments',
    iconKey: 'Wallet',
    title: 'Telcell payments',
    summary: 'Payment acceptance through Telcell Wallet.',
    scopeBoundaries:
      'Payment initiation, callback, idempotent duplicate notifications, test scenarios, and reconciliation.',
    units: { BACKEND: 10, FRONTEND: 3, PM: 1, QA: 2, TECHNICAL_SPECIALIST: 1 },
  },
  {
    code: 'PAY_FASTSHIFT',
    category: 'payments',
    iconKey: 'Wallet',
    title: 'FastShift payments',
    summary: 'Payment acceptance through FastShift.',
    scopeBoundaries:
      'Payment initiation, callback, error handling, test scenarios, and reconciliation.',
    units: { BACKEND: 10, FRONTEND: 3, PM: 1, QA: 2, TECHNICAL_SPECIALIST: 1 },
  },
  {
    code: 'PAY_INECOBANK',
    category: 'payments',
    iconKey: 'CreditCard',
    title: 'InecoBank acquiring',
    summary: 'Card payments through the proprietary InecoBank gateway.',

    scopeBoundaries:
      'Gateway order registration, 3-D Secure, requested refunds, decline handling, and test and production environments.',
    units: { BACKEND: 14, FRONTEND: 4, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'PAY_IDBANK',
    category: 'payments',
    iconKey: 'CreditCard',
    title: 'IDBank acquiring',
    summary: 'Card payments through IDBank via the ArCa gateway.',
    scopeBoundaries:
      'One bank using the ArCa protocol: order registration, 3-D Secure, refunds, decline handling, and test and production environments. The scope is the same for every ArCa bank; separate cards identify the specific bank and credentials.',
    units: { BACKEND: 14, FRONTEND: 4, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'PAY_AMERIABANK',
    category: 'payments',
    iconKey: 'CreditCard',
    title: 'Ameriabank acquiring',
    summary: 'Card payments through the proprietary Ameriabank gateway.',
    scopeBoundaries:
      'Order registration, 3-D Secure, refunds, decline handling, and test and production environments.',
    units: { BACKEND: 14, FRONTEND: 4, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'PAY_STRIPE',
    category: 'payments',
    iconKey: 'CreditCard',
    title: 'Stripe payments',
    summary: 'International card payments through Stripe.',
    scopeBoundaries:
      'Checkout or Payment Intents, webhooks, refunds, settlement currency, and test mode. Stripe subscriptions are a separate card.',
    units: { BACKEND: 12, FRONTEND: 4, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 1 },
  },
  {
    code: 'PAY_PAYPAL',
    category: 'payments',
    iconKey: 'CreditCard',
    title: 'PayPal payments',
    summary: 'Payment acceptance through PayPal.',
    scopeBoundaries:
      'Checkout, webhooks, refunds, settlement currency, sandbox, and production environments.',
    units: { BACKEND: 12, FRONTEND: 4, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 1 },
  },
  {
    code: 'PAY_BANK_TRANSFER',
    category: 'payments',
    iconKey: 'Receipt',
    title: 'Invoice payments',
    summary: 'Bank transfer payments backed by issued invoices.',
    scopeBoundaries:
      'Invoice generation, payment details, manual receipt confirmation, statuses, and notifications.',
    units: { BACKEND: 8, FRONTEND: 3, PM: 1, QA: 2 },
  },
  {
    code: 'PAY_INSTALLMENTS',
    category: 'payments',
    iconKey: 'Percent',
    title: 'Bank installments',
    summary: 'Installment purchases through a partner bank.',
    scopeBoundaries:
      'One installment bank, cart transfer, application statuses, rejection and confirmation, and product restrictions.',
    units: { BACKEND: 14, FRONTEND: 5, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'PAY_SUBSCRIPTION_BILLING',
    category: 'payments',
    iconKey: 'Repeat',
    title: 'Subscription billing',
    summary: 'Recurring automatic charges for product customers.',
    scopeBoundaries:
      'Plans, card attachment, recurring charges, failed attempts, cancellation, and resumption. This is one-time development, not monthly work.',
    units: { BACKEND: 26, FRONTEND: 10, PM: 3, DESIGNER: 3, QA: 6, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'PAY_SPLIT_PAYOUTS',
    category: 'payments',
    iconKey: 'ArrowLeftRight',
    title: 'Payment splitting',
    summary: 'Distribution of received funds among multiple recipients.',
    scopeBoundaries:
      'Split rules, share calculation, transaction log, payouts through the agreed channel, and reconciliation. The legal settlement structure is excluded.',
    units: { BACKEND: 24, FRONTEND: 8, PM: 3, QA: 5, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'PAY_REFUND_FLOW',
    category: 'payments',
    iconKey: 'RefreshCw',
    title: 'Payment refunds and cancellations',
    summary: 'Full and partial refunds with an operation log.',
    scopeBoundaries:
      'Full and partial refunds through already connected gateways, operation permissions, audit log, and customer notification.',
    units: { BACKEND: 12, FRONTEND: 4, PM: 2, QA: 3 },
  },
  {
    code: 'PAY_MULTI_CURRENCY',
    category: 'payments',
    iconKey: 'Coins',
    title: 'Multi-currency pricing',
    summary: 'Prices and settlements in multiple currencies.',
    scopeBoundaries:
      'Agreed currencies, exchange-rate source, rounding, amount display and storage, and payment-time calculation.',
    units: { BACKEND: 16, FRONTEND: 6, PM: 2, QA: 4 },
  },
] as const;
