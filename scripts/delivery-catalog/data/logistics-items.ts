import type { CatalogSeedItem } from './catalog-seed-types';

/** Доставка и логистика. Каждая служба — своя карточка, потому что API и статусы у них разные. */
export const LOGISTICS_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'LOG_DELIVERY_ZONES',
    category: 'logistics',
    iconKey: 'Map',
    title: 'Delivery zones and rates',
    summary: 'Delivery cost calculation by zone and weight.',
    scopeBoundaries:
      'Zone directory, weight and order-total calculation rules, free-delivery threshold, and checkout display.',
    units: { BACKEND: 14, FRONTEND: 6, PM: 2, QA: 3 },
  },
  {
    code: 'LOG_PICKUP_POINTS',
    category: 'logistics',
    iconKey: 'MapPin',
    title: 'Pickup locations',
    summary: 'Order pickup selection from a map or list.',
    scopeBoundaries:
      'Location directory, checkout selection, opening hours, and ready-for-pickup notification. A map is included when a map provider is already connected.',
    units: { BACKEND: 10, FRONTEND: 7, PM: 2, DESIGNER: 2, QA: 3 },
  },
  {
    code: 'LOG_HAYPOST',
    category: 'logistics',
    iconKey: 'Truck',
    title: 'Haypost integration',
    summary: 'Shipment creation and tracking through Haypost.',
    scopeBoundaries:
      'Rate calculation, shipment creation, waybill printing, tracking and status mapping, and error handling.',
    units: { BACKEND: 16, FRONTEND: 5, PM: 2, QA: 4, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'LOG_COURIER_PROVIDER',
    category: 'logistics',
    iconKey: 'Truck',
    title: 'Courier service integration',
    summary: 'One courier service with rate calculation and tracking.',
    scopeBoundaries:
      'One provider: rate calculation, shipment creation, tracking, and status mapping. Each additional service is a separate card.',
    units: { BACKEND: 16, FRONTEND: 5, PM: 2, QA: 4, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'LOG_OWN_COURIER_APP',
    category: 'logistics',
    iconKey: 'Route',
    title: 'In-house courier portal',
    summary: 'Delivery list and status updates for an in-house courier.',
    scopeBoundaries:
      'Courier role, daily orders, status updates and handoff confirmation, and photo or signature on receipt.',
    units: { BACKEND: 20, FRONTEND: 14, PM: 3, DESIGNER: 4, QA: 5 },
  },
  {
    code: 'LOG_DELIVERY_SLOTS',
    category: 'logistics',
    iconKey: 'CalendarClock',
    title: 'Delivery time slots',
    summary: 'Delivery date and time selection with capacity limits.',
    scopeBoundaries:
      'Slot calendar, per-slot order limit, blocking full slots, and manager rescheduling.',
    units: { BACKEND: 16, FRONTEND: 8, PM: 2, DESIGNER: 2, QA: 4 },
  },
  {
    code: 'LOG_ORDER_TRACKING_PAGE',
    category: 'logistics',
    iconKey: 'Route',
    title: 'Order tracking page',
    summary: 'Public order status page accessed by link or number.',
    scopeBoundaries:
      'Access through a protected link, order stages, and carrier data when an integration is available.',
    units: { BACKEND: 8, FRONTEND: 6, PM: 1, DESIGNER: 2, QA: 2 },
  },
  {
    code: 'LOG_WAREHOUSE_OPERATIONS',
    category: 'logistics',
    iconKey: 'Package',
    title: 'Warehouse operations',
    summary: 'Warehouse receiving, transfers, and stocktaking.',
    scopeBoundaries:
      'Receiving, inter-warehouse transfers, stocktaking with discrepancies, operation log, and permissions.',
    units: { BACKEND: 26, FRONTEND: 12, PM: 4, QA: 6 },
  },
  {
    code: 'LOG_BARCODE_SCANNING',
    category: 'logistics',
    iconKey: 'ScanLine',
    title: 'Barcode scanning',
    summary: 'Product scanning during receiving and order picking.',
    scopeBoundaries:
      'Scanner or camera input, product matching, accelerated order picking, and scan errors.',
    units: { BACKEND: 12, FRONTEND: 10, PM: 2, QA: 4, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'LOG_LABEL_PRINTING',
    category: 'logistics',
    iconKey: 'Printer',
    title: 'Waybill and label printing',
    summary: 'Printable documents for shipments.',
    scopeBoundaries:
      'Document templates, single and batch printing, label sizes, and validation on a real printer.',
    units: { BACKEND: 10, FRONTEND: 6, PM: 2, DESIGNER: 2, QA: 3, TECHNICAL_SPECIALIST: 4 },
  },
] as const;
