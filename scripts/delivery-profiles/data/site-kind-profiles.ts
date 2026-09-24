import { codeKindProfile, growPresets, SITE_LAUNCH } from './code-kind-profile';
import type { ProfileSeedKind } from './profile-seed-types';

export const PRODUCT_CATALOG_PROFILE: ProfileSeedKind = codeKindProfile({
  keyStem: 'product-catalog-code',
  productType: 'PRODUCT_CATALOG',
  description:
    'Catalog website core without a cart. One kind is one core; kits only change extra modules.',
  coreItems: [
    { label: 'Catalog with categories' },
    { label: 'Item card' },
    { label: 'Search and filters' },
    { label: 'Catalog admin' },
    { label: 'Responsive layout' },
    { label: 'Basic SEO', note: 'Metadata, sitemap, robots.' },
  ],
  units: { BACKEND: 28, FRONTEND: 32, PM: 10, DESIGNER: 16, QA: 8, TECHNICAL_SPECIALIST: 3 },
  presets: growPresets(
    [...SITE_LAUNCH, 'SHOP_CATALOG_FILTERS', 'CNT_MEDIA_GALLERY', 'MSG_EMAIL_NOTIFICATIONS'],
    ['CNT_MULTILINGUAL', 'SHOP_ADVANCED_SEARCH', 'CNT_FORMS_BUILDER', 'SRV_CATALOG_IMPORT'],
    ['CNT_BLOG', 'ANL_DASHBOARD', 'INT_PUBLIC_API', 'ACC_ROLE_MATRIX'],
  ),
});

export const BLOG_PROFILE: ProfileSeedKind = codeKindProfile({
  keyStem: 'blog-code',
  productType: 'BLOG',
  description: 'Standalone blog-platform core. A shop blog stays an extra card.',
  coreItems: [
    { label: 'Posts, sections, and authors' },
    { label: 'Post page and feed' },
    { label: 'Content editor' },
    { label: 'Content search' },
    { label: 'Responsive layout' },
    { label: 'Basic SEO' },
  ],
  units: { BACKEND: 24, FRONTEND: 30, PM: 9, DESIGNER: 16, QA: 7, TECHNICAL_SPECIALIST: 3 },
  presets: growPresets(
    [...SITE_LAUNCH, 'CNT_BLOG', 'CNT_MEDIA_GALLERY', 'MSG_EMAIL_NOTIFICATIONS'],
    ['CNT_MULTILINGUAL', 'CNT_COMMENTS_MODERATION', 'CNT_SEO_STRUCTURE', 'CNT_FAQ_KNOWLEDGE_BASE'],
    ['CNT_PAGE_BUILDER', 'AI_CONTENT_GENERATION', 'ANL_DASHBOARD', 'INT_PUBLIC_API'],
  ),
});

export const NEWS_MEDIA_PROFILE: ProfileSeedKind = codeKindProfile({
  keyStem: 'news-media-portal-code',
  productType: 'NEWS_MEDIA_PORTAL',
  description:
    'Media-portal core: high-volume publishing, sections, and an editorial loop. One kind is one core.',
  coreItems: [
    { label: 'Feed and sections' },
    { label: 'Story card' },
    { label: 'Editorial team and authors' },
    { label: 'Search and archive' },
    { label: 'Responsive layout' },
  ],
  units: { BACKEND: 40, FRONTEND: 42, PM: 12, DESIGNER: 18, QA: 10, TECHNICAL_SPECIALIST: 4 },
  presets: growPresets(
    [...SITE_LAUNCH, 'CNT_BLOG', 'CNT_MEDIA_GALLERY', 'CNT_SEO_STRUCTURE'],
    ['CNT_MULTILINGUAL', 'CNT_VIDEO_HOSTING', 'CNT_COMMENTS_MODERATION', 'ANL_DASHBOARD'],
    ['AI_SEMANTIC_SEARCH', 'CNT_PAGE_BUILDER', 'INT_PUBLIC_API', 'PLT_PERFORMANCE_HARDENING'],
  ),
});

export const EVENT_WEBSITE_PROFILE: ProfileSeedKind = codeKindProfile({
  keyStem: 'event-website-code',
  productType: 'EVENT_WEBSITE',
  description:
    'Event website core: program and event content. Registration and tickets are separate kinds or extras.',
  coreItems: [
    { label: 'Event home' },
    { label: 'Program and speakers' },
    { label: 'Venue and contacts' },
    { label: 'Responsive layout' },
    { label: 'Basic SEO' },
  ],
  units: { BACKEND: 16, FRONTEND: 24, PM: 7, DESIGNER: 14, QA: 5, TECHNICAL_SPECIALIST: 2 },
  presets: growPresets(
    [...SITE_LAUNCH, 'CNT_FORMS_BUILDER', 'MSG_EMAIL_NOTIFICATIONS'],
    ['CNT_MULTILINGUAL', 'CNT_MEDIA_GALLERY', 'CRM_LEAD_CAPTURE', 'CNT_BANNERS_PROMO'],
    ['BOOK_RESOURCE_SCHEDULE', 'TKT_ISSUE', 'INT_ADS_PIXELS', 'MSG_WHATSAPP_NOTIFICATIONS'],
  ),
});
