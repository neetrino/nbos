import type { CatalogSeedItem } from './catalog-seed-types';

/** Интеграции с внешними системами. Одна карточка — одна внешняя система и одно направление. */
export const INTEGRATIONS_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'INT_1C',
    category: 'integrations',
    iconKey: 'Database',
    title: '1C integration',
    summary: 'Product, stock, and order exchange with 1C.',
    scopeBoundaries:
      'Agreed entities and exchange direction, schedule, item mapping, duplicate-free retries, and error log.',
    units: { BACKEND: 30, FRONTEND: 6, PM: 4, QA: 8, TECHNICAL_SPECIALIST: 6 },
  },
  {
    code: 'INT_HASHSOFT',
    category: 'integrations',
    iconKey: 'Database',
    title: 'ՀԾ integration',
    summary: 'Data exchange with the ՀԾ system.',
    scopeBoundaries:
      'Agreed entities, exchange format and channel, reference-data mapping, and error and retry handling.',
    units: { BACKEND: 30, FRONTEND: 6, PM: 4, QA: 8, TECHNICAL_SPECIALIST: 6 },
  },
  {
    code: 'INT_ERP_GENERIC',
    category: 'integrations',
    iconKey: 'Building2',
    title: 'ERP integration',
    summary: 'Exchange of agreed entities with the customer ERP.',
    scopeBoundaries:
      'One ERP, up to five agreed entities with field mapping, one exchange direction per entity, authentication, error handling, and duplicate-free retries. Historical migration and each additional entity are estimated separately.',
    units: { BACKEND: 30, FRONTEND: 6, PM: 4, QA: 8, TECHNICAL_SPECIALIST: 5 },
  },
  {
    code: 'INT_EXTERNAL_CRM',
    category: 'integrations',
    iconKey: 'Contact',
    title: 'External CRM integration',
    summary: 'Transfer of leads, contacts, and deals to an external CRM.',
    scopeBoundaries:
      'One CRM, transfer direction and contents, field and source mapping, and error handling.',
    units: { BACKEND: 22, FRONTEND: 5, PM: 3, QA: 6, TECHNICAL_SPECIALIST: 3 },
  },
  {
    code: 'INT_WAREHOUSE_SYSTEM',
    category: 'integrations',
    iconKey: 'Warehouse',
    title: 'External warehouse integration',
    summary: 'Stock and shipments from the customer warehouse system.',
    scopeBoundaries:
      'One system, products, stock and shipments, exchange direction, discrepancy reconciliation, and retries.',
    units: { BACKEND: 26, FRONTEND: 6, PM: 3, QA: 7, TECHNICAL_SPECIALIST: 4 },
  },
  {
    code: 'INT_MARKETPLACE_FEED',
    category: 'integrations',
    iconKey: 'Store',
    title: 'Marketplace product feed',
    summary: 'A product feed for a marketplace or price aggregator.',
    scopeBoundaries:
      'One recipient, feed format, product and price selection rules, update schedule, and acceptance validation.',
    units: { BACKEND: 16, FRONTEND: 5, PM: 3, QA: 4, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'INT_MARKETPLACE_ORDERS',
    category: 'integrations',
    iconKey: 'ArrowLeftRight',
    title: 'Marketplace order integration',
    summary: 'Marketplace orders received into the system.',
    scopeBoundaries:
      'One marketplace, orders and status intake, outbound status updates, stock, and cancellation handling.',
    units: { BACKEND: 26, FRONTEND: 8, PM: 4, QA: 7, TECHNICAL_SPECIALIST: 4 },
  },
  {
    code: 'INT_WEB_ANALYTICS',
    category: 'integrations',
    iconKey: 'LineChart',
    title: 'Web analytics and events',
    summary: 'Google Analytics, Tag Manager, and an event map.',
    scopeBoundaries:
      'One tracker, agreed event map, ecommerce when applicable, cookie consent, and event validation.',
    units: { BACKEND: 6, FRONTEND: 10, PM: 2, QA: 4, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'INT_ADS_PIXELS',
    category: 'integrations',
    iconKey: 'TrendingUp',
    title: 'Advertising platform pixels',
    summary: 'Conversion delivery to advertising platforms.',
    scopeBoundaries:
      'Agreed platforms and events, server-side conversions when needed, deduplication, and platform validation.',
    units: { BACKEND: 8, FRONTEND: 8, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'INT_MAPS',
    category: 'integrations',
    iconKey: 'Map',
    title: 'Maps and geocoding',
    summary: 'A website map with addresses and suggestions.',
    scopeBoundaries:
      'One map provider, point display, address suggestions, keys and limits, and offline behavior.',
    units: { BACKEND: 8, FRONTEND: 10, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 1 },
  },
  {
    code: 'INT_PUBLIC_API',
    category: 'integrations',
    iconKey: 'Plug',
    title: 'Product public API',
    summary: 'An external API for customer partners.',
    scopeBoundaries:
      'Agreed methods, authentication and keys, request limits, versioning, and documentation.',
    units: { BACKEND: 28, FRONTEND: 4, PM: 4, QA: 7, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'INT_WEBHOOKS',
    category: 'integrations',
    iconKey: 'Webhook',
    title: 'Outbound webhooks',
    summary: 'Event notifications for external systems.',
    scopeBoundaries:
      'Agreed events, subscriptions and request signing, failure retries, and delivery log.',
    units: { BACKEND: 16, FRONTEND: 6, PM: 2, QA: 4 },
  },
  {
    code: 'INT_SSO_PROVIDER_FOR_PARTNERS',
    category: 'integrations',
    iconKey: 'KeyRound',
    title: 'Partner system SSO',
    summary: 'The product acts as an identity provider for partners.',
    scopeBoundaries:
      'One protocol, partner application registration, token issuance and revocation, and security review.',
    units: { BACKEND: 26, FRONTEND: 6, PM: 4, QA: 7, TECHNICAL_SPECIALIST: 3 },
  },
  {
    code: 'INT_CATALOG_IMPORT_EXPORT',
    category: 'integrations',
    iconKey: 'ArrowLeftRight',
    title: 'Product catalog import and export',
    summary: 'Customer-managed product upload and export by file or URL.',
    scopeBoundaries:
      'Agreed XML, YML, and Excel formats, field mapping, scheduled or on-demand updates, row-error reporting, and duplicate protection. A one-time team-assisted import is a service, not this function.',
    units: { BACKEND: 20, FRONTEND: 10, PM: 3, QA: 6, TECHNICAL_SPECIALIST: 3 },
  },
  {
    code: 'INT_HDM_FISCAL',
    category: 'integrations',
    iconKey: 'Receipt',
    title: 'ՀԴՄ fiscal integration',
    summary: 'Fiscal receipts through ՀԴՄ.',
    scopeBoundaries:
      'Fiscal receipt issuance and cancellation, statuses and receipts, item and tax-rate mapping, and duplicate-free retries. Standard work with the known protocol is included; customer accounting methodology is excluded.',
    units: { BACKEND: 8, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'INT_LEGACY_DB_BRIDGE',
    category: 'integrations',
    iconKey: 'HardDrive',
    title: 'Legacy database bridge',
    summary: 'Read or write access to the customer legacy database.',
    scopeBoundaries:
      'One database, agreed tables and direction, secure access, resilience to outages, and operation log.',
    units: { BACKEND: 24, FRONTEND: 4, PM: 3, QA: 6, TECHNICAL_SPECIALIST: 5 },
  },
] as const;
