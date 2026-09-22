import type { ProfileSeedKind } from './profile-seed-types';

const BASE = [
  'PAY_AMERIABANK',
  'LOG_DELIVERY_ZONES',
  'MSG_EMAIL_NOTIFICATIONS',
  'MSG_SMS_NOTIFICATIONS',
  'SHOP_PRODUCT_VARIANTS',
  'SHOP_CATALOG_FILTERS',
  'SRV_CATALOG_IMPORT',
  'SRV_DOMAIN_HOSTING_SETUP',
  'SRV_ACCEPTANCE_SUPPORT',
  'INT_WEB_ANALYTICS',
  'CNT_MULTILINGUAL',
  'LOY_DISCOUNT_COUPONS',
  'SHOP_REVIEWS',
  'SHOP_WISHLIST',
  'PAY_IDRAM',
] as const;

const EXTENDED = [
  ...BASE,
  'LOY_BONUS_POINTS',
  'LOY_CUSTOMER_WALLET',
  'LOG_WAREHOUSE_OPERATIONS',
  'SHOP_ADVANCED_SEARCH',
  'MSG_WHATSAPP_NOTIFICATIONS',
] as const;

const FULL = [
  ...EXTENDED,
  'SHOP_B2B_PRICING',
  'SHOP_STOCK_MANAGEMENT',
  'ANL_DASHBOARD',
  'INT_MARKETPLACE_FEED',
  'INT_PUBLIC_API',
  'INT_1C',
  'SHOP_MULTI_BRANCH',
  'ACC_SSO_ENTERPRISE',
  'ACC_ROLE_MATRIX',
  'PLT_PERFORMANCE_HARDENING',
  'PLT_SECURITY_HARDENING',
  'PLT_MONITORING_ALERTS',
  'INT_ERP_GENERIC',
] as const;

/**
 * Ядро интернет-магазина. Витрина, корзина и простой checkout — это ядро, поэтому в каталоге
 * лежат только надстройки сверх него. Мультиязычность, бонусы, купоны, кошелёк и интеграции
 * ядром не являются — решение владельца.
 *
 * Аналитики в ядре нет намеренно: карточка `INT_WEB_ANALYTICS` начинается с установки счётчика,
 * поэтому строка про подключение аналитики означала бы оплату одной и той же работы дважды —
 * базовыми units и потом комплектом.
 */
export const SHOP_PROFILE: ProfileSeedKind = {
  keyStem: 'shop-code',
  productType: 'ECOMMERCE',
  productCategory: 'CODE',
  description:
    'Custom-built online store core. One kind is one core; kits only change the extra-module set.',
  coreItems: [
    { label: 'Home page' },
    { label: 'Catalog with categories' },
    { label: 'Product page' },
    { label: 'Cart' },
    { label: 'Checkout', note: 'One agreed payment method and one delivery method.' },
    { label: 'Customer account', note: 'Profile, addresses, and order history.' },
    { label: 'Product search' },
    { label: 'Admin', note: 'Products, categories, and orders.' },
    { label: 'Basic pages', note: 'About, contacts, delivery, and payment.' },
    { label: 'Contact forms' },
    { label: 'Responsive layout' },
    { label: 'Basic SEO', note: 'Metadata, sitemap, robots.' },
  ],
  units: {
    BACKEND: 60,
    FRONTEND: 55,
    PM: 14,
    DESIGNER: 22,
    QA: 12,
    TECHNICAL_SPECIALIST: 6,
  },
  includedFunctionCodes: ['ACC_CUSTOMER_PORTAL'],
  presets: {
    BASE,
    EXTENDED,
    FULL,
  },
};
