import type { ProfileSeedKind } from './profile-seed-types';

const SMALL = [
  'CRM_TASKS',
  'CRM_LEAD_CAPTURE',
  'CRM_CALL_LOG',
  'MSG_EMAIL_NOTIFICATIONS',
  'ANL_EXPORT_EXCEL',
  'ACC_TWO_FACTOR',
  'SRV_DOMAIN_HOSTING_SETUP',
  'SRV_DATA_MIGRATION',
  'SRV_TEAM_TRAINING',
  'SRV_ACCEPTANCE_SUPPORT',
] as const;

const CLASSIC = [
  ...SMALL,
  'CRM_TASK_BOARD',
  'CRM_QUOTES',
  'ANL_DASHBOARD',
  'MSG_SMS_NOTIFICATIONS',
  'CNT_MULTILINGUAL',
] as const;

const LARGE = [
  ...CLASSIC,
  'CRM_WORKFLOW_AUTOMATION',
  'CRM_CONTRACTS',
  'CRM_SUPPORT_TICKETS',
  'ACC_ROLE_MATRIX',
  'ANL_CUSTOM_REPORTS',
  'MSG_WHATSAPP_NOTIFICATIONS',
] as const;

const VERY_LARGE = [
  ...LARGE,
  'CRM_ESIGNATURE',
  'FIN_INVOICES',
  'FIN_PAYMENTS_LEDGER',
  'HR_EMPLOYEE_DIRECTORY',
  'ANL_REPORT_BUILDER',
  'INT_PUBLIC_API',
] as const;

const ENTERPRISE = [
  ...VERY_LARGE,
  'ACC_SSO_ENTERPRISE',
  'ACC_AUDIT_LOG',
  'PLT_MULTI_TENANCY',
  'PLT_SECURITY_HARDENING',
  'PLT_BACKUP_RESTORE',
  'AI_LEAD_SCORING',
  'INT_1C',
  'INT_ERP_GENERIC',
] as const;

/**
 * Ядро CRM. Аккаунтов внешних покупателей здесь нет — только сотрудники. Простые роли и права
 * входят в ядро; карточка `ACC_ROLE_MATRIX` описывает матрицу прав на действия и на объём данных,
 * то есть работу сверх ядра, и остаётся платным модулем.
 */
export const CRM_PROFILE: ProfileSeedKind = {
  keyStem: 'crm-code',
  productType: 'CRM',
  productCategory: 'CODE',
  description:
    'Ядро CRM на собственной разработке. Состав одинаков на всех размерах; размер меняет только объём ядра и набор предвыбранных модулей.',
  coreItems: [
    { label: 'Клиенты, компании и сделки' },
    { label: 'Карточка записи' },
    { label: 'Этапы и воронка' },
    { label: 'Список и фильтры' },
    {
      label: 'Сотрудники, роли и права',
      note: 'Простые роли; матрица прав на данные — отдельный модуль.',
    },
    { label: 'Главный администратор' },
    { label: 'Журнал активности' },
    { label: 'Базовые отчёты' },
    { label: 'Адаптивность' },
  ],
  classicUnits: {
    BACKEND: 80,
    FRONTEND: 65,
    PM: 18,
    DESIGNER: 20,
    QA: 16,
    TECHNICAL_SPECIALIST: 6,
  },
  includedFunctionCodes: [],
  presets: {
    SMALL,
    CLASSIC,
    LARGE,
    VERY_LARGE,
    ENTERPRISE,
  },
};
