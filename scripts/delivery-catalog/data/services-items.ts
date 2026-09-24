import type { CatalogSeedItem } from './catalog-seed-types';

/**
 * Разовые услуги. Это не разработка, а работа руками: заливка, перенос, обработка, настройка.
 * Units здесь почти целиком у PM и технического специалиста, а объём задаёт градация в карточке.
 * Цена продажи у услуг своя и обычно ниже множителя разработки — задаётся на карточке.
 */
export const SERVICES_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'SRV_CATALOG_IMPORT',
    category: 'services',
    iconKey: 'Upload',
    title: 'Catalog data import',
    summary: 'One-time product import from a customer file or source.',
    scopeBoundaries:
      'One source: field mapping, images, duplicates, trial import, and reconciliation. The tier is selected by item count from customer data, not product type. More than 50,000 items requires a separate estimate.',
    tiers: [
      {
        code: 'S_TO_1K',
        label: 'Up to 1,000 items',
        productTypes: [],
        units: { PM: 3, TECHNICAL_SPECIALIST: 10, QA: 2 },
      },
      {
        code: 'M_TO_10K',
        label: '1,000 to 10,000 items',
        productTypes: [],
        units: { PM: 5, TECHNICAL_SPECIALIST: 30, QA: 4 },
      },
      {
        code: 'L_TO_50K',
        label: '10,000 to 50,000 items',
        productTypes: [],
        units: { PM: 8, TECHNICAL_SPECIALIST: 58, QA: 6 },
      },
    ],
  },
  {
    code: 'SRV_CONTENT_FILL',
    category: 'services',
    iconKey: 'FileText',
    title: 'Website content population',
    summary: 'Page population with customer-provided text and images.',
    scopeBoundaries:
      'Agreed page list, placement of ready text and images, and basic block layout. Copywriting is excluded.',
    units: { PM: 3, TECHNICAL_SPECIALIST: 14, QA: 2 },
  },
  {
    code: 'SRV_PHOTO_PROCESSING',
    category: 'services',
    iconKey: 'Image',
    title: 'Product photo processing',
    summary: 'Preparation of product images for publication.',
    scopeBoundaries:
      'Agreed volume, cropping, background, sizing and compression, renaming, and product linkage.',
    units: { PM: 2, DESIGNER: 10, TECHNICAL_SPECIALIST: 4 },
  },
  {
    code: 'SRV_DATA_MIGRATION',
    category: 'services',
    iconKey: 'Database',
    title: 'Legacy system data migration',
    summary: 'Migration of an agreed data set.',
    scopeBoundaries:
      'Agreed data set, cleanup and mapping, trial run, relationship preservation, and cutover plan.',
    units: { BACKEND: 16, PM: 5, TECHNICAL_SPECIALIST: 16, QA: 5 },
  },
  {
    code: 'SRV_SEO_TECH_SETUP',
    category: 'services',
    iconKey: 'TrendingUp',
    title: 'One-time technical SEO setup',
    summary: 'Audit and remediation of technical issues.',
    scopeBoundaries:
      'Audit of an existing website and remediation of technical issues, sitemap and robots, indexing, and report. SEO structure for a new product is a catalog function, not this service. Monthly promotion is excluded.',
    units: { PM: 3, TECHNICAL_SPECIALIST: 12, FRONTEND: 4, QA: 2 },
  },
  {
    code: 'SRV_DOMAIN_HOSTING_SETUP',
    category: 'services',
    iconKey: 'Globe',
    title: 'Domain and hosting setup',
    summary: 'Migration and setup of domain, email, and certificate.',
    scopeBoundaries:
      'DNS records, certificate, email records, migration from previous hosting, and availability checks.',
    units: { PM: 2, TECHNICAL_SPECIALIST: 8, QA: 1 },
  },
  {
    code: 'SRV_EMAIL_DELIVERABILITY',
    category: 'services',
    iconKey: 'Mail',
    title: 'Email deliverability setup',
    summary: 'SPF, DKIM, and DMARC for customer email.',
    scopeBoundaries: 'Authentication records, warm-up when needed, and inbox-placement testing.',
    units: { PM: 2, TECHNICAL_SPECIALIST: 8, QA: 1 },
  },
  {
    code: 'SRV_TEAM_TRAINING',
    category: 'services',
    iconKey: 'GraduationCap',
    title: 'Customer team training',
    summary: 'Training sessions on product use.',
    scopeBoundaries:
      'Agreed number of sessions and participants, training agenda, recording with consent, and follow-up questions.',
    units: { PM: 6, TECHNICAL_SPECIALIST: 8 },
  },
  {
    code: 'SRV_USER_MANUAL',
    category: 'services',
    iconKey: 'BookOpen',
    title: 'Product user manual',
    summary: 'A document or knowledge base for product use.',
    scopeBoundaries:
      'Agreed sections, screenshots, and delivery format. Translation into other languages is a separate service.',
    units: { PM: 5, TECHNICAL_SPECIALIST: 8, DESIGNER: 2 },
  },
  {
    code: 'SRV_ACCEPTANCE_SUPPORT',
    category: 'services',
    iconKey: 'LifeBuoy',
    title: 'Launch support',
    summary: 'Assistance during the first days after launch.',
    scopeBoundaries:
      'Agreed support period, priority responses, minor changes within the agreed scope, demo data preparation, and cleanup before launch. New features are excluded.',
    units: { PM: 6, TECHNICAL_SPECIALIST: 10, QA: 3 },
  },
] as const;
