import type { CatalogSeedItem } from './catalog-seed-types';

/** Extra modules of a ticketing product. Event websites stay a separate kind. */
export const TICKETING_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'TKT_ISSUE',
    category: 'commerce',
    iconKey: 'Ticket',
    title: 'Ticket issue',
    summary: 'Issuing tickets by type after payment or assignment.',
    scopeBoundaries:
      'Ticket types, issue, status, and customer ticket list. QR check-in is a separate card.',
    units: { BACKEND: 18, FRONTEND: 12, PM: 3, DESIGNER: 3, QA: 5 },
  },
  {
    code: 'TKT_QR_CHECKIN',
    category: 'commerce',
    iconKey: 'QrCode',
    title: 'QR ticket check-in',
    summary: 'Validating a ticket at the entrance.',
    scopeBoundaries:
      'QR payload, one-time or multi-entry rules, staff check-in screen, and duplicate prevention.',
    units: { BACKEND: 14, FRONTEND: 12, PM: 2, QA: 4 },
  },
];
