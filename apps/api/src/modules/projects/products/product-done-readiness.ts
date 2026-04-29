export interface ProductDoneReadiness {
  canCompleteWithRuntimeData: boolean;
  blockers: ProductDoneReadinessItem[];
  warnings: ProductDoneReadinessItem[];
  missingRuntimeSignals: ProductDoneReadinessItem[];
  summary: {
    clientAccepted: boolean;
    credentialCount: number;
    domainCount: number;
    openExtensionCount: number;
    openTaskCount: number;
    openTicketCount: number;
    unpaidInvoiceCount: number;
  };
}

interface ProductDoneReadinessItem {
  code: string;
  label: string;
  message: string;
}

interface ProductForDoneReadiness {
  clientAcceptedAt?: Date | string | null;
  project?: { _count?: { credentials?: number; domains?: number } } | null;
  order?: { status?: string | null; invoices?: Array<{ status: string }> } | null;
  extensions?: Array<{ status: string }>;
  tasks?: Array<{ status: string }>;
  tickets?: Array<{ status: string }>;
}

const CLOSED_EXTENSION_STATUSES = ['DONE', 'LOST'];
const CLOSED_TASK_STATUSES = ['DONE', 'DEFERRED', 'CANCELLED'];
const CLOSED_TICKET_STATUSES = ['RESOLVED', 'CLOSED'];
const CLOSED_ORDER_STATUSES = ['FULLY_PAID', 'CLOSED'];

export function buildProductDoneReadiness(product: ProductForDoneReadiness): ProductDoneReadiness {
  const summary = buildDoneReadinessSummary(product);
  const blockers = [
    ...buildClientAcceptanceBlockers(summary),
    ...buildOpenWorkBlockers(summary),
    ...buildFinanceBlockers(product.order, summary.unpaidInvoiceCount),
  ];
  const warnings = buildDocumentationWarnings(summary);
  const missingRuntimeSignals: ProductDoneReadinessItem[] = [];

  return {
    canCompleteWithRuntimeData: blockers.length === 0,
    blockers,
    warnings,
    missingRuntimeSignals,
    summary,
  };
}

function buildDoneReadinessSummary(product: ProductForDoneReadiness) {
  return {
    clientAccepted: Boolean(product.clientAcceptedAt),
    credentialCount: product.project?._count?.credentials ?? 0,
    domainCount: product.project?._count?.domains ?? 0,
    openExtensionCount: countOpen(product.extensions ?? [], CLOSED_EXTENSION_STATUSES),
    openTaskCount: countOpen(product.tasks ?? [], CLOSED_TASK_STATUSES),
    openTicketCount: countOpen(product.tickets ?? [], CLOSED_TICKET_STATUSES),
    unpaidInvoiceCount: (product.order?.invoices ?? []).filter(
      (invoice) => invoice.status !== 'PAID',
    ).length,
  };
}

function buildClientAcceptanceBlockers(summary: ProductDoneReadiness['summary']) {
  if (summary.clientAccepted) return [];
  return [
    {
      code: 'CLIENT_ACCEPTANCE_MISSING',
      label: 'Client acceptance',
      message: 'Client acceptance must be recorded before Product Done.',
    },
  ];
}

function buildOpenWorkBlockers(summary: ProductDoneReadiness['summary']) {
  return [
    ...buildCountBlocker('OPEN_EXTENSIONS', 'Extensions', summary.openExtensionCount),
    ...buildCountBlocker('OPEN_TASKS', 'Tasks', summary.openTaskCount),
    ...buildCountBlocker('OPEN_TICKETS', 'Support tickets', summary.openTicketCount),
  ];
}

function buildFinanceBlockers(order: ProductForDoneReadiness['order'], unpaidInvoiceCount: number) {
  const blockers = buildCountBlocker('UNPAID_INVOICES', 'Finance', unpaidInvoiceCount);
  if (order?.status && !CLOSED_ORDER_STATUSES.includes(order.status)) {
    blockers.push({
      code: 'ORDER_NOT_CLOSED',
      label: 'Finance',
      message: `Linked order is ${order.status}; it must be fully paid or closed before Done.`,
    });
  }
  return blockers;
}

function buildDocumentationWarnings(summary: ProductDoneReadiness['summary']) {
  return [
    ...buildMissingDocumentationWarning(
      'NO_PROJECT_CREDENTIALS',
      'Credentials',
      summary.credentialCount,
    ),
    ...buildMissingDocumentationWarning('NO_PROJECT_DOMAINS', 'Domains', summary.domainCount),
  ];
}

function buildCountBlocker(code: string, label: string, count: number) {
  if (count === 0) return [];
  return [
    { code, label, message: `${count} linked ${label.toLowerCase()} still require closure.` },
  ];
}

function buildMissingDocumentationWarning(code: string, label: string, count: number) {
  if (count > 0) return [];
  return [{ code, label, message: `${label} are not documented on the project yet.` }];
}

function countOpen(items: Array<{ status: string }>, closedStatuses: string[]) {
  return items.filter((item) => !closedStatuses.includes(item.status)).length;
}
