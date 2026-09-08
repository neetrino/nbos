import type { Prisma } from '@nbos/database';
import {
  fillCredentialContextIfEmpty,
  resolveExpenseCredentialId,
} from './expense-credential-link';
import { resolveExpenseProductOwnership } from './expense-product-ownership';

export type ExpenseLinkInput = {
  productId?: string | null;
  credentialId?: string | null;
  expensePlanId?: string | null;
  clientServiceRecordId?: string | null;
  /**
   * When false, `clientServiceRecordId` is only used to fill empty Vault context.
   * Plan-generated cards keep the plan snapshot even if the service later diverges.
   */
  useClientServiceAsSource?: boolean;
};

type ExpenseLinkDb = Parameters<typeof resolveExpenseProductOwnership>[0] &
  Parameters<typeof resolveExpenseCredentialId>[0];

export type ResolvedExpenseLinks = {
  productId: string | null;
  projectId: string | null;
  credentialId: string | null;
};

export async function resolveExpenseLinks(
  prisma: ExpenseLinkDb,
  input: ExpenseLinkInput,
): Promise<ResolvedExpenseLinks> {
  const sourceInput = {
    productId: input.productId,
    credentialId: input.credentialId,
    expensePlanId: input.expensePlanId,
    clientServiceRecordId:
      input.useClientServiceAsSource === false ? undefined : input.clientServiceRecordId,
  };
  const ownership = await resolveExpenseProductOwnership(prisma, sourceInput);
  const credentialId = await resolveExpenseCredentialId(prisma, sourceInput);
  await fillCredentialContextIfEmpty(prisma, credentialId, {
    productId: ownership.productId,
    clientServiceRecordId: input.clientServiceRecordId,
  });
  return { ...ownership, credentialId };
}

export function expenseOwnershipWrite(
  links: ResolvedExpenseLinks,
): Pick<Prisma.ExpenseCreateInput, 'productId' | 'projectId' | 'credentialId'> {
  return {
    productId: links.productId,
    projectId: links.projectId,
    credentialId: links.credentialId,
  };
}
