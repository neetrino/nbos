interface ProjectIntakeProduct {
  id: string;
  name: string;
  status: string;
  deadline: Date | string | null;
  pm: { id: string; firstName: string; lastName: string } | null;
  _count?: { tasks?: number; extensions?: number; tickets?: number };
}

interface ProjectIntakeInvoice {
  status: string;
  paidDate?: Date | string | null;
}

interface ProjectIntakeOrder {
  invoices?: ProjectIntakeInvoice[];
}

interface ProjectIntakeSubscription {
  status: string;
}

interface ProjectIntakeCredential {
  id: string;
}

interface ProjectForIntake {
  products?: ProjectIntakeProduct[];
  extensions?: Array<{ _count?: { tasks?: number } }>;
  orders?: ProjectIntakeOrder[];
  subscriptions?: ProjectIntakeSubscription[];
  credentials?: ProjectIntakeCredential[];
}

export interface ProjectIntakeSummary {
  primaryProduct: {
    id: string;
    name: string;
    status: string;
    deadline: Date | string | null;
    pm: { id: string; firstName: string; lastName: string } | null;
  } | null;
  hasProduct: boolean;
  hasPm: boolean;
  hasDeadline: boolean;
  hasPaidInvoice: boolean;
  hasSubscriptionContext: boolean;
  hasCredentials: boolean;
  productCount: number;
  extensionCount: number;
  openTaskCount: number;
  credentialCount: number;
  subscriptionStatuses: string[];
}

export function buildProjectIntake(project: ProjectForIntake): ProjectIntakeSummary {
  const products = project.products ?? [];
  const primaryProduct = products[0] ?? null;
  const subscriptions = project.subscriptions ?? [];
  const credentials = project.credentials ?? [];

  return {
    primaryProduct: primaryProduct ? toPrimaryProduct(primaryProduct) : null,
    hasProduct: products.length > 0,
    hasPm: products.some((product) => Boolean(product.pm)),
    hasDeadline: products.some((product) => Boolean(product.deadline)),
    hasPaidInvoice: hasPaidInvoice(project.orders ?? []),
    hasSubscriptionContext: subscriptions.length > 0,
    hasCredentials: credentials.length > 0,
    productCount: products.length,
    extensionCount: project.extensions?.length ?? 0,
    openTaskCount: getOpenTaskCount(project),
    credentialCount: credentials.length,
    subscriptionStatuses: subscriptions.map((subscription) => subscription.status),
  };
}

function toPrimaryProduct(product: ProjectIntakeProduct) {
  return {
    id: product.id,
    name: product.name,
    status: product.status,
    deadline: product.deadline,
    pm: product.pm,
  };
}

function hasPaidInvoice(orders: ProjectIntakeOrder[]) {
  return orders.some((order) =>
    (order.invoices ?? []).some(
      (invoice) => invoice.status === 'PAID' || Boolean(invoice.paidDate),
    ),
  );
}

function getOpenTaskCount(project: ProjectForIntake) {
  const productTasks = (project.products ?? []).reduce((sum, product) => {
    return sum + (product._count?.tasks ?? 0);
  }, 0);
  const extensionTasks = (project.extensions ?? []).reduce((sum, extension) => {
    return sum + (extension._count?.tasks ?? 0);
  }, 0);

  return productTasks + extensionTasks;
}
