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
  'CREATING',
  'GET_FINAL_PAY',
  'MAINTENANCE_OFFER',
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
  'NEW',
  'CREATED_IN_GOV',
  'SENT',
  'OVERDUE',
  'ON_HOLD',
  'PAID',
  'UNPAID',
] as const;

export const ORDER_STATUSES = ['ACTIVE', 'PARTIALLY_PAID', 'FULLY_PAID', 'CLOSED'] as const;

export const PAYMENT_TYPES = ['CLASSIC_50_50', 'CLASSIC_30_30_40', 'SUBSCRIPTION'] as const;

export const SUBSCRIPTION_STATUSES = ['ACTIVE', 'PAUSED', 'CANCELLED'] as const;

export const SUBSCRIPTION_TYPES = [
  'MAINTENANCE_ONLY',
  'DEV_AND_MAINTENANCE',
  'DEV_ONLY',
  'PARTNER_SERVICE',
] as const;

export const TASK_STATUSES = [
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'REVIEW',
  'DONE',
  'CANCELLED',
] as const;

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

export const PROJECT_TYPES = ['WHITE_LABEL', 'MIX', 'CUSTOM_CODE'] as const;

export const PRODUCT_TYPES = [
  'WEBSITE',
  'MOBILE_APP',
  'CRM',
  'LOGO',
  'SMM',
  'SEO',
  'OTHER',
] as const;

export const LEAD_SOURCES = [
  'INSTAGRAM',
  'FACEBOOK',
  'WEBSITE',
  'COLD_CALL',
  'PARTNER',
  'REFERRAL',
] as const;

export const DEAL_TYPES = ['NEW_CLIENT', 'EXTENSION', 'UPSELL'] as const;

export const EXTENSION_SIZES = ['MICRO', 'SMALL', 'MEDIUM', 'LARGE'] as const;

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
