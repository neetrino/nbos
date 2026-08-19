type PermissionCheck = (action: string, module: string) => boolean;

/** True when the user may open global search (any v1 module VIEW). */
export function hasAnyGlobalSearchModule(can: PermissionCheck): boolean {
  return (
    can('VIEW', 'CRM_LEADS') ||
    can('VIEW', 'CRM_DEALS') ||
    can('VIEW', 'PROJECTS') ||
    can('VIEW', 'FINANCE_INVOICES') ||
    can('VIEW', 'FINANCE_PAYMENTS') ||
    can('VIEW', 'FINANCE_SUBSCRIPTIONS') ||
    can('VIEW', 'FINANCE_EXPENSES') ||
    can('VIEW', 'ORDERS') ||
    can('VIEW', 'CREDENTIALS')
  );
}
