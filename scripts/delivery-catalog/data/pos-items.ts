import type { CatalogSeedItem } from './catalog-seed-types';

/** Extra modules of a POS product. Offline and hardware stay in desktop cards. */
export const POS_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'POS_RECEIPT',
    category: 'commerce',
    iconKey: 'Receipt',
    title: 'POS receipt',
    summary: 'Fiscal or simple receipt from a point-of-sale sale.',
    scopeBoundaries:
      'Receipt contents, print or send, reprint, and void. Hardware drivers are a separate desktop card.',
    units: { BACKEND: 14, FRONTEND: 12, PM: 2, DESIGNER: 2, QA: 4 },
  },
  {
    code: 'POS_CASH_SHIFT',
    category: 'commerce',
    iconKey: 'Wallet',
    title: 'Cashier shift',
    summary: 'Opening and closing a cashier shift with totals.',
    scopeBoundaries:
      'Shift open and close, cash counted, discrepancy, and shift report. Accounting export is a separate card.',
    units: { BACKEND: 16, FRONTEND: 12, PM: 3, QA: 4 },
  },
  {
    code: 'POS_BARCODE',
    category: 'commerce',
    iconKey: 'ScanLine',
    title: 'Barcode lookup',
    summary: 'Finding a product by barcode on the till.',
    scopeBoundaries:
      'Barcode scan or entry, product match, unknown-code handling, and cart add. Device integration is a separate card.',
    units: { BACKEND: 10, FRONTEND: 8, PM: 2, QA: 3 },
  },
];
