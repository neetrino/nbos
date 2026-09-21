/**
 * Delivery Compensation v2 RBAC modules.
 * Catalog content is separate from Owner/CEO financial rules.
 * Do not grant RULES from FINANCE_BONUSES or COMPANY.
 */

export const FUNCTION_CATALOG_MODULE = 'FUNCTION_CATALOG' as const;
export const DELIVERY_COMPENSATION_RULES_MODULE = 'DELIVERY_COMPENSATION_RULES' as const;

export const FUNCTION_CATALOG_VIEW = `${FUNCTION_CATALOG_MODULE}_VIEW` as const;
export const FUNCTION_CATALOG_EDIT = `${FUNCTION_CATALOG_MODULE}_EDIT` as const;
export const FUNCTION_CATALOG_ADD = `${FUNCTION_CATALOG_MODULE}_ADD` as const;
export const FUNCTION_CATALOG_DELETE = `${FUNCTION_CATALOG_MODULE}_DELETE` as const;

export const DELIVERY_COMPENSATION_RULES_VIEW =
  `${DELIVERY_COMPENSATION_RULES_MODULE}_VIEW` as const;
export const DELIVERY_COMPENSATION_RULES_EDIT =
  `${DELIVERY_COMPENSATION_RULES_MODULE}_EDIT` as const;
export const DELIVERY_COMPENSATION_RULES_ADD = `${DELIVERY_COMPENSATION_RULES_MODULE}_ADD` as const;
export const DELIVERY_COMPENSATION_RULES_DELETE =
  `${DELIVERY_COMPENSATION_RULES_MODULE}_DELETE` as const;

export const FUNCTION_CATALOG_VIEW_PERMISSION_ID = 'perm-function-catalog-view' as const;
export const FUNCTION_CATALOG_EDIT_PERMISSION_ID = 'perm-function-catalog-edit' as const;
export const FUNCTION_CATALOG_ADD_PERMISSION_ID = 'perm-function-catalog-add' as const;
export const FUNCTION_CATALOG_DELETE_PERMISSION_ID = 'perm-function-catalog-delete' as const;

export const DELIVERY_COMPENSATION_RULES_VIEW_PERMISSION_ID =
  'perm-delivery-compensation-rules-view' as const;
export const DELIVERY_COMPENSATION_RULES_EDIT_PERMISSION_ID =
  'perm-delivery-compensation-rules-edit' as const;
export const DELIVERY_COMPENSATION_RULES_ADD_PERMISSION_ID =
  'perm-delivery-compensation-rules-add' as const;
export const DELIVERY_COMPENSATION_RULES_DELETE_PERMISSION_ID =
  'perm-delivery-compensation-rules-delete' as const;

/** Content readers: team can open instructions without Compensation/HR. */
export const FUNCTION_CATALOG_READ_DEFAULT_ROLE_IDS = [
  'role-owner',
  'role-ceo',
  'role-pm',
  'role-head-delivery',
  'role-developer',
  'role-developer-frontend',
  'role-junior-developer',
  'role-designer',
  'role-qa',
  'role-tech-specialist',
  'role-seller',
  'role-head-sales',
  'role-operations-manager',
] as const;

/** Instruction editors. Financial publish stays on RULES. */
export const FUNCTION_CATALOG_CONTENT_EDIT_DEFAULT_ROLE_IDS = [
  'role-owner',
  'role-ceo',
  'role-pm',
  'role-head-delivery',
] as const;

/** Units/rates/base profiles. Finance is intentionally omitted. */
export const DELIVERY_COMPENSATION_RULES_DEFAULT_ROLE_IDS = ['role-owner', 'role-ceo'] as const;

/**
 * Product/Extension configuration edits stay on PROJECTS object scope.
 * Do not grant DELIVERY_COMPENSATION_RULES to PM/Finance for this capability.
 */
export const DELIVERY_CONFIGURATION_PERMISSION_MODULE = 'PROJECTS' as const;
