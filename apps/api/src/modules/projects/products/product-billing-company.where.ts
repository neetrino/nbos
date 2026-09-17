import type { Prisma } from '@nbos/database';

/** Product owns billing company; null falls back to the project brand default. */
export function productBillingCompanyWhere(companyId: string): Prisma.ProductWhereInput {
  return {
    OR: [{ companyId }, { companyId: null, project: { is: { companyId } } }],
  };
}

/** Extension inherits the parent product’s company, then the project default. */
export function extensionBillingCompanyWhere(companyId: string): Prisma.ExtensionWhereInput {
  return {
    OR: [
      { product: { is: { companyId } } },
      { product: { is: { companyId: null } }, project: { is: { companyId } } },
    ],
  };
}

export function resolveProductBillingCompanyId(
  productCompanyId: string | null | undefined,
  projectCompanyId: string | null | undefined,
): string | null {
  return productCompanyId ?? projectCompanyId ?? null;
}
