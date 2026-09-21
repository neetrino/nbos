import type { ProfileSeedKind } from './profile-seed-types';

const BASE = [
  'MSG_EMAIL_NOTIFICATIONS',
  'ANL_EXPORT_EXCEL',
  'ACC_TWO_FACTOR',
  'SRV_DOMAIN_HOSTING_SETUP',
  'SRV_DATA_MIGRATION',
  'SRV_TEAM_TRAINING',
  'SRV_ACCEPTANCE_SUPPORT',
  'ANL_DASHBOARD',
] as const;

const EXTENDED = [
  ...BASE,
  'CNT_MULTILINGUAL',
  'ACC_ROLE_MATRIX',
  'ANL_CUSTOM_REPORTS',
  'FIN_INVOICES',
  'FIN_PAYMENTS_LEDGER',
  'FIN_EXPENSES',
] as const;

const FULL = [
  ...EXTENDED,
  'FIN_PAYROLL',
  'FIN_TAX_REPORTS',
  'INT_1C',
  'INT_ERP_GENERIC',
  'INT_PUBLIC_API',
  'ACC_SSO_ENTERPRISE',
  'ACC_AUDIT_LOG',
  'PLT_MULTI_TENANCY',
  'PLT_SECURITY_HARDENING',
  'PLT_BACKUP_RESTORE',
] as const;

/**
 * Ядро ERP. Тяжелее CRM: учёт и справочники, не воронка продаж. Карточки `FIN_*` не входят
 * в базу — это платные модули комплекта, иначе учёт оплатили бы дважды.
 */
export const ERP_PROFILE: ProfileSeedKind = {
  keyStem: 'erp-code',
  productType: 'ERP',
  productCategory: 'CODE',
  description:
    'Ядро ERP на собственной разработке. Один вид — одно ядро; комплекты меняют только набор extra-модулей.',
  coreItems: [
    { label: 'Сущности учёта', note: 'Документы и остатки; не воронка сделок.' },
    { label: 'Справочники' },
    { label: 'Карточка записи' },
    { label: 'Список и фильтры' },
    {
      label: 'Сотрудники, роли и права',
      note: 'Простые роли; матрица прав на данные — отдельный модуль.',
    },
    { label: 'Главный администратор' },
    { label: 'Базовые отчёты' },
    { label: 'Адаптивность' },
  ],
  units: {
    BACKEND: 110,
    FRONTEND: 85,
    PM: 22,
    DESIGNER: 24,
    QA: 20,
    TECHNICAL_SPECIALIST: 10,
  },
  includedFunctionCodes: [],
  presets: {
    BASE,
    EXTENDED,
    FULL,
  },
};
