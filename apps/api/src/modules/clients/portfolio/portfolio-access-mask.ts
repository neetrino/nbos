export interface PortfolioAccessMask {
  finance: boolean;
  subscriptions: boolean;
  support: boolean;
  communication: boolean;
  files: boolean;
  /** When false, invoice/subscription/deal amounts are omitted in the API payload. */
  financeAmounts: boolean;
}

/**
 * Invoice monetary detail in portfolio: users with FINANCE_INVOICES VIEW but no EDIT/ADD (e.g. PM)
 * see status only per docs/NBOS/02-Modules/03-Clients/03-Client-Portfolio.md §5.1.
 */
function canViewInvoiceMonetaryAmounts(permissions: Record<string, string>): boolean {
  const edit = permissions['FINANCE_INVOICES_EDIT'];
  const add = permissions['FINANCE_INVOICES_ADD'];
  const editOk = Boolean(edit && edit !== 'NONE');
  const addOk = Boolean(add && add !== 'NONE');
  return editOk || addOk;
}

function hasModuleView(permissions: Record<string, string>, module: string): boolean {
  const scope = permissions[`${module}_VIEW`];
  return Boolean(scope && scope !== 'NONE');
}

/**
 * Derives portfolio section visibility from NBOS RBAC permission keys (module_VIEW scopes).
 */
export function buildPortfolioAccessMask(permissions: Record<string, string>): PortfolioAccessMask {
  const finance = hasModuleView(permissions, 'FINANCE_INVOICES');
  const subscriptions = hasModuleView(permissions, 'FINANCE_SUBSCRIPTIONS');
  const support = hasModuleView(permissions, 'SUPPORT_TICKETS');
  const communication =
    hasModuleView(permissions, 'MESSENGER') || hasModuleView(permissions, 'MAIL');
  const files = hasModuleView(permissions, 'DRIVE');
  const financeAmounts = canViewInvoiceMonetaryAmounts(permissions);

  return {
    finance,
    subscriptions,
    support,
    communication,
    files,
    financeAmounts,
  };
}
