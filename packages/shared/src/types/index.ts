import type {
  LEAD_STATUSES,
  DEAL_STATUSES,
  PRODUCT_STATUSES,
  INVOICE_STATUSES,
  ORDER_STATUSES,
  PAYMENT_TYPES,
  SUBSCRIPTION_STATUSES,
  SUBSCRIPTION_TYPES,
  TASK_STATUSES,
  TASK_PRIORITIES,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  BONUS_TYPES,
  BONUS_STATUSES,
  EMPLOYEE_ROLES,
  EMPLOYEE_LEVELS,
  CREDENTIAL_ACCESS_LEVELS,
  CREDENTIAL_CATEGORIES,
  EXPENSE_TYPES,
  EXPENSE_CATEGORIES,
  PRODUCT_TYPES,
  LEAD_SOURCES,
  DEAL_TYPES,
  EXTENSION_SIZES,
  PARTNER_TYPES,
  PARTNER_DIRECTIONS,
} from '../constants';

export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type DealStatus = (typeof DEAL_STATUSES)[number];
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentType = (typeof PAYMENT_TYPES)[number];
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];
export type SubscriptionType = (typeof SUBSCRIPTION_TYPES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type TicketCategory = (typeof TICKET_CATEGORIES)[number];
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];
export type TicketStatus = (typeof TICKET_STATUSES)[number];
export type BonusType = (typeof BONUS_TYPES)[number];
export type BonusStatus = (typeof BONUS_STATUSES)[number];
export type EmployeeRole = (typeof EMPLOYEE_ROLES)[number];
export type EmployeeLevel = (typeof EMPLOYEE_LEVELS)[number];
export type CredentialAccessLevel = (typeof CREDENTIAL_ACCESS_LEVELS)[number];
export type CredentialCategory = (typeof CREDENTIAL_CATEGORIES)[number];
export type ExpenseType = (typeof EXPENSE_TYPES)[number];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type ProductType = (typeof PRODUCT_TYPES)[number];
export type LeadSource = (typeof LEAD_SOURCES)[number];
export type DealType = (typeof DEAL_TYPES)[number];
export type ExtensionSize = (typeof EXTENSION_SIZES)[number];
export type PartnerType = (typeof PARTNER_TYPES)[number];
export type PartnerDirection = (typeof PARTNER_DIRECTIONS)[number];

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
}
