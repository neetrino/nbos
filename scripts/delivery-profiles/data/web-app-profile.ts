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
  'MSG_SMS_NOTIFICATIONS',
  'ACC_TEAM_ACCOUNTS',
  'SRV_TEAM_TRAINING',
] as const;

const FULL = [
  ...EXTENDED,
  'ACC_ROLE_MATRIX',
  'ACC_SSO_ENTERPRISE',
  'INT_PUBLIC_API',
  'PLT_SECURITY_HARDENING',
  'PLT_MONITORING_ALERTS',
  'ACC_AUDIT_LOG',
  'PLT_BACKUP_RESTORE',
] as const;

/**
 * Ядро сервиса на заказ (бывший WEB_APP). Внешних покупательских аккаунтов нет — только
 * сотрудники. Матрица прав на данные остаётся платным модулем.
 */
export const WEB_APP_PROFILE: ProfileSeedKind = {
  keyStem: 'web-app-code',
  productType: 'WEB_APP',
  productCategory: 'CODE',
  description:
    'Ядро сервиса на заказ на собственной разработке. Один вид — одно ядро; комплекты меняют только набор extra-модулей.',
  coreItems: [
    { label: 'Каркас приложения' },
    { label: 'Авторизация сотрудников' },
    { label: 'Экраны списка и карточки' },
    { label: 'Простая админка' },
    { label: 'Роли и доступ', note: 'Простые роли; матрица прав на данные — отдельный модуль.' },
    { label: 'Адаптивность' },
  ],
  units: {
    BACKEND: 40,
    FRONTEND: 42,
    PM: 12,
    DESIGNER: 18,
    QA: 10,
    TECHNICAL_SPECIALIST: 5,
  },
  includedFunctionCodes: [],
  presets: {
    BASE,
    EXTENDED,
    FULL,
  },
};
