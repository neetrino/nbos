import type { ProfileSeedKind } from './profile-seed-types';

const BASE = [
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
  'CRM_TASK_BOARD',
  'CRM_QUOTES',
  'ANL_DASHBOARD',
  'MSG_SMS_NOTIFICATIONS',
  'CNT_MULTILINGUAL',
] as const;

const EXTENDED = [
  ...BASE,
  'CRM_WORKFLOW_AUTOMATION',
  'CRM_CONTRACTS',
  'CRM_SUPPORT_TICKETS',
  'ACC_ROLE_MATRIX',
  'ANL_CUSTOM_REPORTS',
  'MSG_WHATSAPP_NOTIFICATIONS',
] as const;

const FULL = [
  ...EXTENDED,
  'CRM_ESIGNATURE',
  'FIN_INVOICES',
  'FIN_PAYMENTS_LEDGER',
  'HR_EMPLOYEE_DIRECTORY',
  'ANL_REPORT_BUILDER',
  'INT_PUBLIC_API',
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
    'Custom-built CRM core. One kind is one core; kits only change the extra-module set.',
  coreItems: [
    { label: 'Customers, companies, and deals' },
    { label: 'Record card' },
    { label: 'Stages and pipeline' },
    { label: 'List and filters' },
    {
      label: 'Employees, roles, and permissions',
      note: 'Simple roles; a data-permission matrix is a separate module.',
    },
    { label: 'Lead administrator' },
    { label: 'Activity log' },
    { label: 'Basic reports' },
    { label: 'Responsive layout' },
  ],
  units: {
    BACKEND: 80,
    FRONTEND: 65,
    PM: 18,
    DESIGNER: 20,
    QA: 16,
    TECHNICAL_SPECIALIST: 6,
  },
  includedFunctionCodes: [],
  presets: {
    BASE,
    EXTENDED,
    FULL,
  },
};
