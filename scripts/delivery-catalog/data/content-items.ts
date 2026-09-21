import type { CatalogSeedItem } from './catalog-seed-types';

/**
 * Контент и медиа. Мультиязычность разделена на две карточки: на сайте это в основном тексты и
 * маршруты, в системе — ещё и данные, справочники и документы, работа принципиально больше.
 */
export const CONTENT_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'CNT_MULTILINGUAL',
    category: 'content',
    iconKey: 'Languages',
    title: 'Product localization',
    summary: 'Product language architecture: keys, switching, and system copy.',
    scopeBoundaries:
      'Pricing covers localization architecture rather than each language: the second language establishes the architecture, while later AI-assisted translations add little effort. Scope depends on product type. Languages with a different writing direction or alphabet are estimated separately.',
    tiers: [
      {
        code: 'T1_SITE',
        label: 'Landing page, business card, company website',
        productTypes: ['LANDING', 'BUSINESS_CARD_WEBSITE', 'COMPANY_WEBSITE'],
        units: { FRONTEND: 2, PM: 1 },
      },
      {
        code: 'T2_CONTENT',
        label: 'Online store and content website',
        productTypes: ['ECOMMERCE'],
        units: { BACKEND: 4, FRONTEND: 4, PM: 1, QA: 2 },
      },
      {
        code: 'T3_SYSTEM',
        label: 'CRM, ERP, platform',
        productTypes: ['CRM', 'ERP', 'SAAS', 'WEB_APP'],
        units: { BACKEND: 26, FRONTEND: 18, PM: 4, QA: 7 },
      },
    ],
  },
  {
    code: 'CNT_BLOG',
    category: 'content',
    iconKey: 'Newspaper',
    title: 'Blog',
    summary: 'An article section with categories and administration.',
    scopeBoundaries:
      'Articles, categories and tags, article and listing pages, SEO fields, and editor. Article creation is excluded.',
    units: { BACKEND: 12, FRONTEND: 12, PM: 2, DESIGNER: 4, QA: 4 },
  },
  {
    code: 'CNT_PAGE_BUILDER',
    category: 'content',
    iconKey: 'Layout',
    title: 'Page builder',
    summary: 'Page assembly from blocks without a developer.',
    scopeBoundaries:
      'Agreed block set, block order and settings, preview, and publication. Free-form layout is excluded.',
    units: { BACKEND: 24, FRONTEND: 26, PM: 4, DESIGNER: 6, QA: 7 },
  },
  {
    code: 'CNT_MEDIA_GALLERY',
    category: 'content',
    iconKey: 'Image',
    title: 'Media gallery and library',
    summary: 'Image upload and storage with processing.',
    scopeBoundaries:
      'Upload, resizing and compression, alternative text, ordering and deletion, and size and format limits.',
    units: { BACKEND: 14, FRONTEND: 10, PM: 2, DESIGNER: 2, QA: 4 },
  },
  {
    code: 'CNT_VIDEO_HOSTING',
    category: 'content',
    iconKey: 'Video',
    title: 'Product video',
    summary: 'Video upload or embedding with a player.',
    scopeBoundaries:
      'One hosting method, player, preview, and mobile behavior. Transcoding is included only with an agreed provider.',
    units: { BACKEND: 12, FRONTEND: 8, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'CNT_DOCUMENT_LIBRARY',
    category: 'content',
    iconKey: 'Library',
    title: 'Document library',
    summary: 'Files with categories, search, and access control.',
    scopeBoundaries:
      'Upload and categories, search, view and download permissions, file versions, and access log.',
    units: { BACKEND: 18, FRONTEND: 10, PM: 3, QA: 4 },
  },
  {
    code: 'CNT_SEO_STRUCTURE',
    category: 'content',
    iconKey: 'TrendingUp',
    title: 'Website SEO structure',
    summary: 'Metadata, sitemap, and structured data.',
    scopeBoundaries:
      'Meta and canonical management, sitemap and robots, structured data for agreed types, redirects, and indexing checks.',
    units: { BACKEND: 10, FRONTEND: 8, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'CNT_FAQ_KNOWLEDGE_BASE',
    category: 'content',
    iconKey: 'BookOpen',
    title: 'Knowledge base and FAQ',
    summary: 'Searchable questions and instructions.',
    scopeBoundaries:
      'Sections and articles, search, usefulness rating, and administration. Content creation is excluded.',
    units: { BACKEND: 10, FRONTEND: 10, PM: 2, DESIGNER: 3, QA: 3 },
  },
  {
    code: 'CNT_FORMS_BUILDER',
    category: 'content',
    iconKey: 'ClipboardList',
    title: 'Form builder',
    summary: 'Feedback and request forms without a developer.',
    scopeBoundaries:
      'Field types, validation, request recipients, spam protection, and response storage and export.',
    units: { BACKEND: 18, FRONTEND: 16, PM: 3, DESIGNER: 4, QA: 5 },
  },
  {
    code: 'CNT_BANNERS_PROMO',
    category: 'content',
    iconKey: 'Image',
    title: 'Banners and promotional blocks',
    summary: 'Managed banners with display scheduling.',
    scopeBoundaries: 'Placements, schedule, links, mobile behavior, and display priority.',
    units: { BACKEND: 8, FRONTEND: 8, PM: 2, DESIGNER: 3, QA: 3 },
  },
  {
    code: 'CNT_PRINT_TEMPLATES',
    category: 'content',
    iconKey: 'Printer',
    title: 'Printable document templates',
    summary: 'Printable contracts, completion certificates, and invoices.',
    scopeBoundaries:
      'Agreed templates, data substitution, numbering, print and PDF output, and validation on a real printer.',
    units: { BACKEND: 14, FRONTEND: 6, PM: 2, DESIGNER: 3, QA: 3 },
  },
  {
    code: 'CNT_COMMENTS_MODERATION',
    category: 'content',
    iconKey: 'MessageSquare',
    title: 'Moderated comments',
    summary: 'User comments with review and moderation.',
    scopeBoundaries:
      'Comment form, moderation and reports, notifications, spam protection, and deletion permissions.',
    units: { BACKEND: 12, FRONTEND: 8, PM: 2, QA: 3 },
  },
] as const;
