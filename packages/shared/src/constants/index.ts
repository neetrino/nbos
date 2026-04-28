export const LEAD_STATUSES = [
  'NEW',
  'DIDNT_GET_THROUGH',
  'CONTACT_ESTABLISHED',
  'MQL',
  'SPAM',
  'SQL',
] as const;

export const DEAL_STATUSES = [
  'START_CONVERSATION',
  'DISCUSS_NEEDS',
  'MEETING',
  'CAN_WE_DO_IT',
  'SEND_OFFER',
  'GET_ANSWER',
  'DEPOSIT_AND_CONTRACT',
  'FAILED',
  'WON',
] as const;

export const PRODUCT_STATUSES = [
  'NEW',
  'CREATING',
  'DEVELOPMENT',
  'QA',
  'TRANSFER',
  'ON_HOLD',
  'DONE',
  'LOST',
] as const;

export const INVOICE_STATUSES = [
  'THIS_MONTH',
  'CREATE_INVOICE',
  'WAITING',
  'DELAYED',
  'ON_HOLD',
  'FAIL',
  'PAID',
] as const;

export const ORDER_STATUSES = ['ACTIVE', 'PARTIALLY_PAID', 'FULLY_PAID', 'CLOSED'] as const;

export const PAYMENT_TYPES = ['CLASSIC', 'SUBSCRIPTION'] as const;

export const SUBSCRIPTION_STATUSES = [
  'PENDING',
  'ACTIVE',
  'ON_HOLD',
  'CANCELLED',
  'COMPLETED',
] as const;

export const SUBSCRIPTION_TYPES = [
  'MAINTENANCE_ONLY',
  'DEV_AND_MAINTENANCE',
  'DEV_ONLY',
  'PARTNER_SERVICE',
] as const;

export const TASK_STATUSES = ['NEW', 'IN_PROGRESS', 'DONE', 'DEFERRED', 'CANCELLED'] as const;

export const TASK_PRIORITIES = ['CRITICAL', 'HIGH', 'NORMAL', 'LOW'] as const;

export const TICKET_CATEGORIES = [
  'INCIDENT',
  'SERVICE_REQUEST',
  'CHANGE_REQUEST',
  'PROBLEM',
] as const;

export const TICKET_PRIORITIES = ['P1', 'P2', 'P3'] as const;

export const TICKET_STATUSES = [
  'NEW',
  'TRIAGED',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
  'REOPENED',
] as const;

export const BONUS_TYPES = ['SALES', 'DELIVERY', 'PM', 'DESIGN', 'MARKETING'] as const;

export const BONUS_STATUSES = [
  'INCOMING',
  'EARNED',
  'PENDING_ELIGIBILITY',
  'VESTED',
  'HOLDBACK',
  'ACTIVE',
  'PAID',
  'CLAWBACK',
] as const;

export const EMPLOYEE_ROLES = [
  'CEO',
  'SELLER',
  'PM',
  'DEVELOPER',
  'JUNIOR_DEVELOPER',
  'DESIGNER',
  'QA',
  'TECH_SPECIALIST',
  'FINANCE_DIRECTOR',
  'MARKETING',
  'HEAD_SALES',
  'HEAD_DELIVERY',
] as const;

export const EMPLOYEE_LEVELS = ['JUNIOR', 'MIDDLE', 'SENIOR', 'LEAD', 'HEAD'] as const;

export const CREDENTIAL_ACCESS_LEVELS = ['SECRET', 'PROJECT_TEAM', 'DEPARTMENT', 'ALL'] as const;

export const CREDENTIAL_CATEGORIES = [
  'ADMIN',
  'DOMAIN',
  'HOSTING',
  'SERVICE',
  'APP',
  'MAIL',
  'API_KEY',
  'DATABASE',
] as const;

export const EXPENSE_TYPES = ['PLANNED', 'UNPLANNED'] as const;

export const EXPENSE_CATEGORIES = [
  'DOMAIN',
  'HOSTING',
  'SERVICE',
  'MARKETING',
  'SALARY',
  'BONUS',
  'PARTNER_PAYOUT',
  'TOOLS',
  'OTHER',
] as const;

export const PRODUCT_CATEGORIES = ['CODE', 'WORDPRESS', 'SHOPIFY', 'MARKETING', 'OTHER'] as const;

export const PRODUCT_TYPES = [
  'BUSINESS_CARD_WEBSITE',
  'COMPANY_WEBSITE',
  'MOBILE_APP',
  'WEB_APP',
  'CRM',
  'ECOMMERCE',
  'SAAS',
  'LANDING',
  'ERP',
  'LOGO',
  'BRANDING',
  'DESIGN',
  'SEO',
  'PPC',
  'SMM',
  'OTHER',
] as const;

export const PRODUCT_TYPES_BY_CATEGORY: Record<string, readonly string[]> = {
  CODE: [
    'BUSINESS_CARD_WEBSITE',
    'COMPANY_WEBSITE',
    'MOBILE_APP',
    'WEB_APP',
    'CRM',
    'ECOMMERCE',
    'SAAS',
    'LANDING',
    'ERP',
  ],
  WORDPRESS: ['BUSINESS_CARD_WEBSITE', 'COMPANY_WEBSITE', 'ECOMMERCE', 'LANDING'],
  SHOPIFY: ['ECOMMERCE'],
  MARKETING: ['LOGO', 'BRANDING', 'DESIGN', 'SEO', 'PPC', 'SMM'],
  OTHER: [],
} as const;

export const LEAD_SOURCES = ['MARKETING', 'SALES', 'PARTNER', 'CLIENT'] as const;

export const MARKETING_CHANNELS = [
  'SMM',
  'WEBSITE',
  'LIST_AM',
  'GOOGLE_ADS',
  'META_ADS',
  'CONTENT',
  'SEO',
  'OFFLINE',
  'OTHER',
] as const;

export const MARKETING_ACCOUNT_STATUSES = ['ACTIVE', 'PAUSED', 'ARCHIVED'] as const;

export const MARKETING_ACTIVITY_STATUSES = [
  'IDEA',
  'PREPARING',
  'READY',
  'LAUNCHED',
  'FINISHED',
  'ARCHIVED',
] as const;

export const MARKETING_ACTIVITY_TYPES = [
  'AD_CAMPAIGN',
  'SMM_POST',
  'STORY_REEL',
  'LIST_AM_PROMOTION',
  'WEBSITE_LANDING',
  'SEO_WORK',
  'OFFLINE_ACTIVITY',
  'OTHER',
] as const;

export const MARKETING_ATTRIBUTION_OPTION_TYPES = ['ACCOUNT', 'ACTIVITY', 'ORGANIC'] as const;

export const DEAL_TYPES = ['PRODUCT', 'EXTENSION', 'MAINTENANCE', 'OUTSOURCE'] as const;

export const EXTENSION_SIZES = ['MICRO', 'SMALL', 'MEDIUM', 'LARGE'] as const;

export const EXTENSION_STATUSES = ['NEW', 'DEVELOPMENT', 'QA', 'TRANSFER', 'DONE', 'LOST'] as const;

export const ORDER_TYPES = ['PRODUCT', 'EXTENSION', 'MAINTENANCE', 'OUTSOURCE'] as const;

export const PARTNER_TYPES = ['REGULAR', 'PREMIUM'] as const;

export const PARTNER_DIRECTIONS = ['INBOUND', 'OUTBOUND', 'BOTH'] as const;

export const SLA_DEADLINES = {
  P1: { response: 4, resolve: 24 },
  P2: { response: 8, resolve: 48 },
  P3: { response: 24, resolve: 72 },
} as const;

export const BONUS_PERCENTAGES = {
  SALES: {
    COLD_CALL: 10,
    MARKETING: 7,
    EXISTING_CLIENT: 5,
    PARTNER_REFERRAL: 5,
  },
  DELIVERY: {
    WHITE_LABEL: 7,
    MIX: 10,
    CUSTOM_CODE: 15,
  },
  PARTNER_DEFAULT: 30,
  HOLDBACK: 20,
} as const;
