/**
 * Delivery Compensation v2 contracts. No commercial units or AMD rates live here.
 * Owner publishes real numbers through admin UI after implementation.
 */

export const DELIVERY_COMPENSATION_MODEL_VERSION = '2' as const;

export const DELIVERY_COMPENSATION_CURRENCY = 'AMD' as const;

export const DELIVERY_COMPENSATION_ROLE_KEYS = [
  'BACKEND',
  'FRONTEND',
  'PM',
  'DESIGNER',
  'QA',
  'TECHNICAL_SPECIALIST',
] as const;

export type DeliveryCompensationRoleKey = (typeof DELIVERY_COMPENSATION_ROLE_KEYS)[number];

export const DELIVERY_FUNCTION_STATUSES = ['DRAFT', 'ACTIVE', 'ARCHIVED'] as const;
export type DeliveryFunctionStatus = (typeof DELIVERY_FUNCTION_STATUSES)[number];

export const DELIVERY_NORMATIVE_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export type DeliveryNormativeStatus = (typeof DELIVERY_NORMATIVE_STATUSES)[number];

export const DELIVERY_ROLE_UNIT_KINDS = ['REQUIRED', 'NOT_REQUIRED'] as const;
export type DeliveryRoleUnitKind = (typeof DELIVERY_ROLE_UNIT_KINDS)[number];

export const DELIVERY_ENTITY_KINDS = ['PRODUCT', 'EXTENSION'] as const;
export type DeliveryEntityKind = (typeof DELIVERY_ENTITY_KINDS)[number];

export const DELIVERY_CONFIG_SIZES = [
  'SMALL',
  'CLASSIC',
  'LARGE',
  'VERY_LARGE',
  'ENTERPRISE',
] as const;
export type DeliveryConfigSize = (typeof DELIVERY_CONFIG_SIZES)[number];

export const DELIVERY_IMPLEMENTATION_BASES = [
  'FROM_SCRATCH',
  'EXISTING_BASE',
  'WHITE_LABEL',
] as const;
export type DeliveryImplementationBase = (typeof DELIVERY_IMPLEMENTATION_BASES)[number];

export const DELIVERY_DESIGN_MODES = ['AI_DESIGN', 'CONCEPT', 'FULL_DESIGN'] as const;
export type DeliveryDesignMode = (typeof DELIVERY_DESIGN_MODES)[number];

export const DELIVERY_FEATURE_ORIGINS = ['INCLUDED', 'EXTRA'] as const;
export type DeliveryFeatureOrigin = (typeof DELIVERY_FEATURE_ORIGINS)[number];

export const DELIVERY_FEATURE_WORK_STATES = ['NOT_STARTED', 'IN_PROGRESS', 'ACCEPTED'] as const;
export type DeliveryFeatureWorkState = (typeof DELIVERY_FEATURE_WORK_STATES)[number];

export const DELIVERY_CONFIGURATION_MODES = ['LEGACY', 'V2'] as const;
export type DeliveryConfigurationMode = (typeof DELIVERY_CONFIGURATION_MODES)[number];

export const DELIVERY_BONUS_SOURCE_V2 = 'DELIVERY_CONFIGURATOR_V2' as const;

export const DELIVERY_BONUS_COMPONENT_KINDS = ['BASE', 'FEATURE'] as const;
export type DeliveryBonusComponentKind = (typeof DELIVERY_BONUS_COMPONENT_KINDS)[number];

/** New products enroll only after Owner readiness. Existing rows stay implicit LEGACY. */
export const DELIVERY_COMPENSATION_ENROLLMENT_DEFAULT = false;

/**
 * Catalog categories, in the order the picker rail shows them. A category is a direction, not a
 * restriction: a function filed under `commerce` may be selected for a CRM and the other way round.
 * Categories exist so a hundred-plus cards stay findable, nothing more.
 */
export const DELIVERY_FUNCTION_CATEGORIES = [
  'payments',
  'commerce',
  'logistics',
  'messaging',
  'accounts',
  'content',
  'loyalty',
  'booking',
  'crm_ops',
  'finance_ops',
  'hr_ops',
  'analytics',
  'ai',
  'integrations',
  'platform',
  'mobile',
  'desktop',
  'services',
] as const;

export type DeliveryFunctionCategory = (typeof DELIVERY_FUNCTION_CATEGORIES)[number];

export function isDeliveryFunctionCategory(value: string): value is DeliveryFunctionCategory {
  return (DELIVERY_FUNCTION_CATEGORIES as readonly string[]).includes(value);
}

/**
 * Lucide icon keys allowed on catalog cards. Unknown keys are rejected at the API boundary.
 */
export const DELIVERY_FUNCTION_ICON_ALLOWLIST = [
  'CreditCard',
  'Warehouse',
  'Building2',
  'Contact',
  'Library',
  'Database',
  'Truck',
  'ShoppingCart',
  'Languages',
  'Search',
  'UserCircle',
  'Shield',
  'Store',
  'Calendar',
  'Repeat',
  'BarChart3',
  'KeyRound',
  'Bell',
  'Globe',
  'LineChart',
  'Server',
  'Layout',
  'Palette',
  'Code',
  'Bug',
  'Wrench',
  'FileText',
  'Layers',
  'Boxes',
  'CircuitBoard',
  'Banknote',
  'Wallet',
  'Receipt',
  'Coins',
  'Gift',
  'Ticket',
  'Percent',
  'Package',
  'MapPin',
  'Map',
  'Send',
  'MessageSquare',
  'MessageCircle',
  'Mail',
  'Phone',
  'Smartphone',
  'Monitor',
  'Bot',
  'Sparkles',
  'BrainCircuit',
  'Mic',
  'Image',
  'Video',
  'FileSpreadsheet',
  'ClipboardList',
  'ListChecks',
  'KanbanSquare',
  'Users',
  'UserPlus',
  'Building',
  'Briefcase',
  'CalendarClock',
  'CalendarCheck',
  'Clock',
  'Timer',
  'Star',
  'Heart',
  'Filter',
  'SlidersHorizontal',
  'ArrowLeftRight',
  'Upload',
  'Download',
  'RefreshCw',
  'Webhook',
  'Plug',
  'Cloud',
  'HardDrive',
  'Printer',
  'ScanLine',
  'QrCode',
  'Lock',
  'Fingerprint',
  'Gauge',
  'Zap',
  'TrendingUp',
  'PieChart',
  'Table',
  'Newspaper',
  'BookOpen',
  'GraduationCap',
  'Headphones',
  'LifeBuoy',
  'Route',
  'GitBranch',
  'Rocket',
  'Network',
] as const;

export type DeliveryFunctionIconKey = (typeof DELIVERY_FUNCTION_ICON_ALLOWLIST)[number];

export const DELIVERY_COMPENSATION_ERROR_CODES = [
  'CONFIGURATION_INCOMPLETE',
  'ROLE_ASSIGNMENT_REQUIRED',
  'NORMATIVE_NOT_CONFIGURED',
  'CONFIGURATION_CONFLICT',
  'REDISTRIBUTION_REQUIRED',
  'FINANCIAL_ALLOCATION_LOCKED',
  'FUNCTION_ALREADY_SELECTED',
  'LEGACY_ADOPTION_REQUIRED',
  'AI_DESIGNER_REVIEW_REQUIRED',
  'UNITS_NOT_CONFIGURED',
  'RATE_NOT_CONFIGURED',
] as const;

export type DeliveryCompensationErrorCode = (typeof DELIVERY_COMPENSATION_ERROR_CODES)[number];

export const DELIVERY_UNITS_SCALE = 4;
export const DELIVERY_MONEY_SCALE = 2;
export const DELIVERY_SHARE_PERCENT_SCALE = 2;
export const DELIVERY_SHARE_PERCENT_TOTAL = 100;
