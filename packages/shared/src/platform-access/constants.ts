export const PLATFORM_ACCESS_ACTIONS = ['VIEW', 'EDIT'] as const;
export type PlatformAccessAction = (typeof PLATFORM_ACCESS_ACTIONS)[number];

export const PLATFORM_RESOURCE_FAMILIES = [
  'CREDENTIALS',
  'DRIVE',
  'FINANCE',
  'PROJECT_HUB',
  'TASKS',
] as const;
export type PlatformResourceFamily = (typeof PLATFORM_RESOURCE_FAMILIES)[number];

export const ACCESS_SCOPE_MODES = ['NONE', 'ALL', 'ASSIGNED'] as const;
export type AccessScopeMode = (typeof ACCESS_SCOPE_MODES)[number];

export const PROJECT_TEAM_ROLES = ['ADMIN', 'MEMBER'] as const;
export type ProjectTeamRole = (typeof PROJECT_TEAM_ROLES)[number];

export const PRODUCT_TEAM_SLOTS = [
  'PM',
  'DEVELOPER',
  'DESIGNER',
  'TECHNICAL_SPECIALIST',
  'QA_LEAD',
  'CONTRIBUTOR',
] as const;
export type ProductTeamSlot = (typeof PRODUCT_TEAM_SLOTS)[number];

export const TEAM_MEMBER_SOURCES = [
  'MANUAL',
  'PRODUCT_SLOT',
  'EXTENSION_ASSIGNEE',
  'MIGRATION',
] as const;
export type TeamMemberSource = (typeof TEAM_MEMBER_SOURCES)[number];

export const RESOURCE_GRANT_RESOURCE_TYPES = ['credential'] as const;
export type ResourceGrantResourceType = (typeof RESOURCE_GRANT_RESOURCE_TYPES)[number];

/** Maps legacy `Product` FK fields to platform access slots. */
export const PRODUCT_SLOT_FIELD_MAP = {
  pmId: 'PM',
  developerId: 'DEVELOPER',
  designerId: 'DESIGNER',
  technicalSpecialistId: 'TECHNICAL_SPECIALIST',
  qaLeadId: 'QA_LEAD',
} as const satisfies Record<string, ProductTeamSlot>;

export type ProductSlotFieldName = keyof typeof PRODUCT_SLOT_FIELD_MAP;
