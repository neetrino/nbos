export type ProductBillingCompanyRef = { id: string; name: string };

export function resolveProductBillingCompany(product: {
  company?: ProductBillingCompanyRef | null;
  companyId?: string | null;
  project?: {
    company?: ProductBillingCompanyRef | null;
    companyId?: string | null;
  };
}): ProductBillingCompanyRef | null {
  if (product.company) return product.company;
  if (product.project?.company) return product.project.company;
  return null;
}

export function uniqueProductBillingCompanies(
  products: Array<{
    company?: ProductBillingCompanyRef | null;
    companyId?: string | null;
  }>,
): ProductBillingCompanyRef[] {
  const byId = new Map<string, string>();
  for (const product of products) {
    if (!product.company) continue;
    if (!byId.has(product.company.id)) byId.set(product.company.id, product.company.name);
  }
  return [...byId.entries()].map(([id, name]) => ({ id, name }));
}
