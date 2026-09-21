import type { ProfileSeedKind } from './profile-seed-types';

const BASE = [
  'MOB_PUSH_NOTIFICATIONS',
  'MOB_STORE_PUBLISHING',
  'MOB_DEEP_LINKS',
  'MSG_EMAIL_NOTIFICATIONS',
  'SRV_ACCEPTANCE_SUPPORT',
  'SRV_DOMAIN_HOSTING_SETUP',
  'CNT_MULTILINGUAL',
  'ACC_SOCIAL_LOGIN',
  'MOB_CAMERA_SCANNER',
  'MSG_SMS_NOTIFICATIONS',
  'MOB_GEOLOCATION',
] as const;

const EXTENDED = [
  ...BASE,
  'MOB_IN_APP_PURCHASE',
  'MOB_OFFLINE_MODE',
  'MOB_TABLET_LAYOUT',
  'ACC_BIOMETRIC_LOGIN',
  'INT_MAPS',
  'ANL_DASHBOARD',
] as const;

const FULL = [
  ...EXTENDED,
  'PAY_AMERIABANK',
  'LOY_BONUS_POINTS',
  'MSG_WHATSAPP_NOTIFICATIONS',
  'ACC_TWO_FACTOR',
  'INT_PUBLIC_API',
  'ANL_FUNNEL_ANALYSIS',
  'MOB_WEARABLE_COMPANION',
  'ACC_SSO_ENTERPRISE',
  'ACC_ROLE_MATRIX',
  'PLT_SECURITY_HARDENING',
  'PLT_PERFORMANCE_HARDENING',
  'PLT_MONITORING_ALERTS',
  'INT_ERP_GENERIC',
] as const;

/**
 * Ядро мобильного приложения. Публикации в ядре нет: карточка `MOB_STORE_PUBLISHING` начинается
 * с аккаунтов, подписи сборок и прохождения ревью, то есть покрывает и первый магазин тоже. Если
 * бы ядро обещало публикацию в один магазин, клиент платил бы за неё дважды.
 *
 * Аналитики здесь нет вообще. `INT_WEB_ANALYTICS` — веб-карточка (GA, Tag Manager, cookies,
 * события электронной торговли), приложению она не подходит, а мобильный сбор сбоев и продуктовую
 * аналитику владелец не продаёт: карточка остаётся черновиком (решение 1.16).
 */
export const MOBILE_APP_PROFILE: ProfileSeedKind = {
  keyStem: 'mobile-app-code',
  productType: 'MOBILE_APP',
  productCategory: 'CODE',
  description:
    'Ядро мобильного приложения на собственной разработке. Одинаковый функционал в вебе и в приложении стоит одинаково; ось платформы на units не влияет.',
  coreItems: [
    { label: 'Каркас приложения' },
    { label: 'Навигация' },
    { label: 'Авторизация' },
    { label: 'Экраны списка и детали' },
    { label: 'Профиль пользователя' },
    {
      label: 'Инфраструктура push на уровне каркаса',
      note: 'Сценарии отправки — отдельный модуль.',
    },
    {
      label: 'Сборка релизной версии',
      note: 'Публикация в магазины — отдельный модуль.',
    },
    { label: 'Адаптивность под размеры телефонов' },
  ],
  units: {
    BACKEND: 45,
    FRONTEND: 60,
    PM: 14,
    DESIGNER: 24,
    QA: 14,
    TECHNICAL_SPECIALIST: 8,
  },
  includedFunctionCodes: [],
  presets: {
    BASE,
    EXTENDED,
    FULL,
  },
};
