export const CRM_RESPONSIBLE_FILTER_KEY = 'responsible';

export const CRM_RESPONSIBLE_ME = 'me';
export const CRM_RESPONSIBLE_ME_SELLER = 'me_seller';
export const CRM_RESPONSIBLE_ME_ASSISTANT = 'me_assistant';

export type CrmResponsibleVariant = 'lead' | 'deal';

export type CrmResponsibleEmployeeOption = {
  id: string;
  label: string;
};

export type CrmResponsibleSelectOption = {
  value: string;
  label: string;
};

export type DealResponsibilityQuery = {
  sellerId?: string;
  sellerAssistantId?: string;
  involvedEmployeeId?: string;
};

function isReservedResponsibleValue(value: string): boolean {
  return (
    value === CRM_RESPONSIBLE_ME ||
    value === CRM_RESPONSIBLE_ME_SELLER ||
    value === CRM_RESPONSIBLE_ME_ASSISTANT
  );
}

/** Options for the shared search Responsible filter (All is implicit). */
export function buildCrmResponsibleFilterOptions(
  variant: CrmResponsibleVariant,
  employees: readonly CrmResponsibleEmployeeOption[],
  meId: string | null,
): CrmResponsibleSelectOption[] {
  const options: CrmResponsibleSelectOption[] = [];
  if (meId) {
    options.push({ value: CRM_RESPONSIBLE_ME, label: 'Me' });
    if (variant === 'deal') {
      options.push({ value: CRM_RESPONSIBLE_ME_SELLER, label: 'Me as Seller' });
      options.push({ value: CRM_RESPONSIBLE_ME_ASSISTANT, label: 'Me as Assistant' });
    }
  }
  for (const employee of employees) {
    if (meId && employee.id === meId) continue;
    options.push({ value: employee.id, label: employee.label });
  }
  return options;
}

export function resolveLeadAssignedToFilter(
  filterValue: string | undefined,
  meId: string | null,
): string | undefined {
  if (!filterValue || filterValue === 'all') return undefined;
  if (filterValue === CRM_RESPONSIBLE_ME) return meId ?? undefined;
  if (isReservedResponsibleValue(filterValue)) return undefined;
  return filterValue;
}

export function resolveDealResponsibilityQuery(
  filterValue: string | undefined,
  meId: string | null,
): DealResponsibilityQuery {
  if (!filterValue || filterValue === 'all') return {};
  if (filterValue === CRM_RESPONSIBLE_ME) {
    return meId ? { involvedEmployeeId: meId } : {};
  }
  if (filterValue === CRM_RESPONSIBLE_ME_SELLER) {
    return meId ? { sellerId: meId } : {};
  }
  if (filterValue === CRM_RESPONSIBLE_ME_ASSISTANT) {
    return meId ? { sellerAssistantId: meId } : {};
  }
  return { sellerId: filterValue };
}
