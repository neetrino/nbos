import type { ProfileSeedKind } from './profile-seed-types';

const BASE = [
  'SRV_DOMAIN_HOSTING_SETUP',
  'SRV_ACCEPTANCE_SUPPORT',
  'SRV_CONTENT_FILL',
  'SRV_SEO_TECH_SETUP',
  'INT_WEB_ANALYTICS',
  'CNT_FORMS_BUILDER',
  'CNT_MEDIA_GALLERY',
  'MSG_EMAIL_NOTIFICATIONS',
  'CNT_MULTILINGUAL',
  'CNT_BLOG',
  'CNT_SEO_STRUCTURE',
  'CNT_BANNERS_PROMO',
  'CNT_FAQ_KNOWLEDGE_BASE',
] as const;

const EXTENDED = [
  ...BASE,
  'CNT_PAGE_BUILDER',
  'CNT_VIDEO_HOSTING',
  'CNT_DOCUMENT_LIBRARY',
  'CRM_LEAD_CAPTURE',
  'INT_ADS_PIXELS',
  'ACC_TEAM_ACCOUNTS',
] as const;

const FULL = [
  ...EXTENDED,
  'CNT_COMMENTS_MODERATION',
  'PLT_CUSTOM_DOMAINS',
  'PLT_MULTI_TENANCY',
  'ANL_DASHBOARD',
  'INT_EXTERNAL_CRM',
  'AI_SEMANTIC_SEARCH',
  'ACC_SSO_ENTERPRISE',
  'PLT_SECURITY_HARDENING',
  'PLT_PERFORMANCE_HARDENING',
  'PLT_MONITORING_ALERTS',
  'PLT_ACCESSIBILITY_PASS',
  'PLT_BACKUP_RESTORE',
  'INT_PUBLIC_API',
] as const;

/**
 * Ядро сайта компании. Новости или блог входят в ядро только в минимальном виде: карточка
 * `CNT_BLOG` описывает полноценный раздел с рубриками, тегами и SEO-полями, поэтому она остаётся
 * платным модулем, а не «входит в базу».
 *
 * Аналитики в ядре нет намеренно: карточка `INT_WEB_ANALYTICS` начинается с установки счётчика,
 * поэтому строка про подключение аналитики означала бы двойную оплату той же работы.
 */
export const COMPANY_SITE_PROFILE: ProfileSeedKind = {
  keyStem: 'company-site-code',
  productType: 'COMPANY_WEBSITE',
  productCategory: 'CODE',
  description:
    'Ядро корпоративного сайта на собственной разработке. Один вид — одно ядро; комплекты меняют только набор extra-модулей.',
  coreItems: [
    { label: 'Главная страница' },
    { label: 'Внутренние страницы', note: 'Услуги, о компании, контакты.' },
    {
      label: 'Новости или блог в минимальном виде',
      note: 'Список и страница записи, без рубрик, тегов и SEO-полей.',
    },
    { label: 'Формы обратной связи' },
    { label: 'Админка контента' },
    { label: 'Поиск по сайту' },
    { label: 'Адаптивность' },
    { label: 'Базовое SEO', note: 'Метаданные, sitemap, robots.' },
  ],
  units: {
    BACKEND: 20,
    FRONTEND: 28,
    PM: 8,
    DESIGNER: 18,
    QA: 6,
    TECHNICAL_SPECIALIST: 3,
  },
  includedFunctionCodes: [],
  presets: {
    BASE,
    EXTENDED,
    FULL,
  },
};
