export interface ProductDoneReadiness {
  canCompleteWithRuntimeData: boolean;
  blockers: ProductDoneReadinessItem[];
  warnings: ProductDoneReadinessItem[];
  missingRuntimeSignals: ProductDoneReadinessItem[];
  summary: {
    approvedOfferFilePresent: boolean;
    clientAccepted: boolean;
    contractFilePresent: boolean;
    credentialCount: number;
    deliveryFileRuntimeAvailable: boolean;
    domainCount: number;
    expiringDomainCount: number;
    expiredDomainCount: number;
    handoffCredentialCount: number;
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
  project?: {
    credentials?: Array<{ category: string }>;
    domains?: Array<{ status: string }>;
    _count?: { credentials?: number; domains?: number };
  } | null;
  order?: {
    status?: string | null;
    deal?: {
      offerFileUrl?: string | null;
      contractFileUrl?: string | null;
    } | null;
    invoices?: Array<{ status: string }>;
  } | null;
  extensions?: Array<{ status: string }>;
  tasks?: Array<{ status: string }>;
  tickets?: Array<{ status: string }>;
}

const CLOSED_EXTENSION_STATUSES = ['DONE', 'LOST'];
const CLOSED_TASK_STATUSES = ['DONE', 'DEFERRED', 'CANCELLED'];
const CLOSED_TICKET_STATUSES = ['RESOLVED', 'CLOSED'];
const CLOSED_ORDER_STATUSES = ['FULLY_PAID', 'CLOSED'];
const HANDOFF_CREDENTIAL_CATEGORIES = ['ADMIN', 'DOMAIN', 'HOSTING', 'APP', 'API_KEY', 'DATABASE'];

export function buildProductDoneReadiness(product: ProductForDoneReadiness): ProductDoneReadiness {
  const summary = buildDoneReadinessSummary(product);
  const blockers = [
    ...buildClientAcceptanceBlockers(summary),
    ...buildOpenWorkBlockers(summary),
    ...buildFinanceBlockers(product.order, summary.unpaidInvoiceCount),
    ...buildHandoffBlockers(summary),
  ];
  const warnings = buildDocumentationWarnings(summary);
  const missingRuntimeSignals = buildMissingRuntimeSignals(summary);

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
    approvedOfferFilePresent: Boolean(product.order?.deal?.offerFileUrl),
    clientAccepted: Boolean(product.clientAcceptedAt),
    contractFilePresent: Boolean(product.order?.deal?.contractFileUrl),
    credentialCount: product.project?._count?.credentials ?? 0,
    deliveryFileRuntimeAvailable: false,
    domainCount: product.project?._count?.domains ?? 0,
    expiringDomainCount: countDomains(product.project?.domains ?? [], 'EXPIRING_SOON'),
    expiredDomainCount: countDomains(product.project?.domains ?? [], 'EXPIRED'),
    handoffCredentialCount: countHandoffCredentials(product.project?.credentials ?? []),
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

function buildHandoffBlockers(summary: ProductDoneReadiness['summary']) {
  if (summary.expiredDomainCount === 0) return [];
  return [
    {
      code: 'EXPIRED_DOMAINS',
      label: 'Domains',
      message: `${summary.expiredDomainCount} project domains are expired before handoff.`,
    },
  ];
}

function buildDocumentationWarnings(summary: ProductDoneReadiness['summary']) {
  return [
    ...buildMissingDocumentationWarning(
      'NO_PROJECT_CREDENTIALS',
      'Credentials',
      summary.credentialCount,
    ),
    ...buildMissingDocumentationWarning('NO_PROJECT_DOMAINS', 'Domains', summary.domainCount),
    ...buildMissingHandoffCredentialWarning(summary),
    ...buildMissingOfferFileWarning(summary),
    ...buildMissingContractFileWarning(summary),
    ...buildExpiringDomainWarning(summary.expiringDomainCount),
  ];
}

function buildMissingRuntimeSignals(summary: ProductDoneReadiness['summary']) {
  if (summary.deliveryFileRuntimeAvailable) return [];
  return [
    {
      code: 'DELIVERY_FILE_LINK_RUNTIME_MISSING',
      label: 'Delivery files',
      message:
        'Drive FileAsset/FileLink runtime is not available yet, so final delivery files cannot be verified automatically.',
    },
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

function buildMissingHandoffCredentialWarning(summary: ProductDoneReadiness['summary']) {
  if (summary.credentialCount === 0 || summary.handoffCredentialCount > 0) return [];
  return [
    {
      code: 'NO_HANDOFF_CREDENTIALS',
      label: 'Credentials',
      message: 'Project credentials exist, but none are marked as delivery handoff categories.',
    },
  ];
}

function buildMissingOfferFileWarning(summary: ProductDoneReadiness['summary']) {
  if (summary.approvedOfferFilePresent) return [];
  return [
    {
      code: 'NO_APPROVED_OFFER_FILE',
      label: 'Drive handoff',
      message: 'Linked order deal has no approved offer file URL recorded.',
    },
  ];
}

function buildMissingContractFileWarning(summary: ProductDoneReadiness['summary']) {
  if (summary.contractFilePresent) return [];
  return [
    {
      code: 'NO_CONTRACT_FILE',
      label: 'Drive handoff',
      message: 'Linked order deal has no contract file URL recorded.',
    },
  ];
}

function buildExpiringDomainWarning(count: number) {
  if (count === 0) return [];
  return [
    {
      code: 'EXPIRING_DOMAINS',
      label: 'Domains',
      message: `${count} project domains are expiring soon and should be checked before handoff.`,
    },
  ];
}

function countOpen(items: Array<{ status: string }>, closedStatuses: string[]) {
  return items.filter((item) => !closedStatuses.includes(item.status)).length;
}

function countDomains(domains: Array<{ status: string }>, status: string) {
  return domains.filter((domain) => domain.status === status).length;
}

function countHandoffCredentials(credentials: Array<{ category: string }>) {
  return credentials.filter((credential) =>
    HANDOFF_CREDENTIAL_CATEGORIES.includes(credential.category),
  ).length;
}
