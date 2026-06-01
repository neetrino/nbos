/** Short label for a finance zone entry href (hero hub + sidebar). */
export function financeZoneEntryLabel(href: string): string {
  const path = href.split('?')[0] ?? href;
  const labels: Record<string, string> = {
    '/finance/dashboard': 'Dashboard',
    '/finance/reports': 'Reports',
    '/finance/journal': 'Journal',
    '/finance/orders': 'Orders',
    '/finance/invoices': 'Invoices',
    '/finance/payments': 'Payments',
    '/finance/subscriptions': 'Subscriptions',
    '/finance/expenses': 'Pay Now',
    '/finance/expenses/plans': 'Expenses Plan',
    '/finance/client-services': 'Client services',
    '/finance/payroll': 'Payroll',
    '/finance/salary': 'Salary',
    '/finance/bonus-pools': 'Unit economics',
    '/finance/unit-economics': 'Unit economics',
    '/finance/bonuses': 'Bonus',
    '/bonus': 'Bonus',
  };
  return labels[path] ?? 'Open zone';
}
