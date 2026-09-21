import type { ProfileSeedKind } from './profile-seed-types';

const BASE = [
  'SRV_DOMAIN_HOSTING_SETUP',
  'SRV_ACCEPTANCE_SUPPORT',
  'MSG_EMAIL_NOTIFICATIONS',
  'ACC_TWO_FACTOR',
] as const;

const EXTENDED = [
  ...BASE,
  'CNT_MULTILINGUAL',
  'ANL_DASHBOARD',
  'PLT_CUSTOM_DOMAINS',
  'ACC_TEAM_ACCOUNTS',
  'SRV_TEAM_TRAINING',
] as const;

const FULL = [
  ...EXTENDED,
  'PLT_MULTI_TENANCY',
  'ACC_SSO_ENTERPRISE',
  'INT_PUBLIC_API',
  'PLT_SECURITY_HARDENING',
  'PLT_PERFORMANCE_HARDENING',
  'PLT_MONITORING_ALERTS',
  'PAY_SUBSCRIPTION_BILLING',
  'ACC_AUDIT_LOG',
] as const;

/**
 * Ядро SaaS. Мультитенантность — модуль `PLT_MULTI_TENANCY`, не строка ядра. Биллинг подписок
 * тоже не ядро: карточка `PAY_SUBSCRIPTION_BILLING` живёт в полном комплекте.
 */
export const SAAS_PROFILE: ProfileSeedKind = {
  keyStem: 'saas-code',
  productType: 'SAAS',
  productCategory: 'CODE',
  description:
    'Ядро SaaS-продукта на собственной разработке. Один вид — одно ядро; комплекты меняют только набор extra-модулей.',
  coreItems: [
    { label: 'Каркас продукта' },
    { label: 'Авторизация сотрудников' },
    { label: 'Рабочие экраны', note: 'Список и карточка основной сущности продукта.' },
    { label: 'Простая админка' },
    { label: 'Профиль пользователя' },
    { label: 'Адаптивность' },
  ],
  units: {
    BACKEND: 70,
    FRONTEND: 60,
    PM: 16,
    DESIGNER: 22,
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
