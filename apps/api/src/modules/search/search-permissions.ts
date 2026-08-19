import type { FinanceSearchSubtype, SearchGroupDefinition, SearchGroupId } from './search.types';

const SEARCH_GROUP_LABELS: Record<SearchGroupId, string> = {
  leads: 'Leads',
  deals: 'Deals',
  products: 'Products',
  finance: 'Finance',
  credentials: 'Credentials',
};

function hasModuleView(permissions: Record<string, string | undefined>, module: string): boolean {
  const scope = permissions[`${module}_VIEW`]?.trim().toUpperCase();
  return !!scope && scope !== 'NONE';
}

/** Finance tab visible when any finance list module is viewable. */
export function hasFinanceSearchAccess(permissions: Record<string, string | undefined>): boolean {
  return (
    hasModuleView(permissions, 'FINANCE_INVOICES') ||
    hasModuleView(permissions, 'FINANCE_PAYMENTS') ||
    hasModuleView(permissions, 'FINANCE_SUBSCRIPTIONS') ||
    hasModuleView(permissions, 'FINANCE_EXPENSES') ||
    hasModuleView(permissions, 'ORDERS')
  );
}

/** Finance entity searchers gated individually by module VIEW. */
export function resolveAllowedFinanceSubtypes(
  permissions: Record<string, string | undefined>,
): FinanceSearchSubtype[] {
  const subtypes: FinanceSearchSubtype[] = [];
  if (hasModuleView(permissions, 'FINANCE_INVOICES')) subtypes.push('invoice');
  if (hasModuleView(permissions, 'FINANCE_PAYMENTS')) subtypes.push('payment');
  if (hasModuleView(permissions, 'ORDERS')) subtypes.push('order');
  if (hasModuleView(permissions, 'FINANCE_SUBSCRIPTIONS')) subtypes.push('subscription');
  if (hasModuleView(permissions, 'FINANCE_EXPENSES')) subtypes.push('expense');
  return subtypes;
}

function isGroupAllowed(
  groupId: SearchGroupId,
  permissions: Record<string, string | undefined>,
): boolean {
  switch (groupId) {
    case 'leads':
      return hasModuleView(permissions, 'CRM_LEADS');
    case 'deals':
      return hasModuleView(permissions, 'CRM_DEALS');
    case 'products':
      return hasModuleView(permissions, 'PROJECTS');
    case 'finance':
      return hasFinanceSearchAccess(permissions);
    case 'credentials':
      return hasModuleView(permissions, 'CREDENTIALS');
    default:
      return false;
  }
}

/** Search tabs the caller may use (server source of truth). */
export function resolveAllowedSearchGroups(
  permissions: Record<string, string | undefined>,
): SearchGroupDefinition[] {
  const groups: SearchGroupDefinition[] = [];
  for (const id of Object.keys(SEARCH_GROUP_LABELS) as SearchGroupId[]) {
    if (isGroupAllowed(id, permissions)) {
      groups.push({ id, label: SEARCH_GROUP_LABELS[id] });
    }
  }
  return groups;
}

export function isSearchGroupAllowedForUser(
  group: SearchGroupId,
  permissions: Record<string, string | undefined>,
): boolean {
  return isGroupAllowed(group, permissions);
}
