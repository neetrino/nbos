import { BadRequestException } from '@nestjs/common';

export type ExpenseCredentialInput = {
  credentialId?: string | null;
  expensePlanId?: string | null;
  clientServiceRecordId?: string | null;
};

type ExpenseCredentialDb = {
  credential: {
    findUnique: (args: {
      where: { id: string };
      select: {
        id: true;
        productId: true;
        clientServiceRecordId: true;
        trashedAt: true;
      };
    }) => Promise<{
      id: string;
      productId: string | null;
      clientServiceRecordId: string | null;
      trashedAt: Date | null;
    } | null>;
    update: (args: {
      where: { id: string };
      data: { productId?: string; clientServiceRecordId?: string };
    }) => Promise<unknown>;
  };
  expensePlan: {
    findUnique: (args: {
      where: { id: string };
      select: { credentialId: true };
    }) => Promise<{ credentialId: string | null } | null>;
  };
  clientServiceRecord: {
    findUnique: (args: {
      where: { id: string };
      select: { providerAccountId: true };
    }) => Promise<{ providerAccountId: string | null } | null>;
  };
};

const CREDENTIAL_CONFLICT = 'Expense credential does not match the linked source credential.';
const CREDENTIAL_MISSING = 'Credential not found';

function trimId(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function uniqueIds(ids: Array<string | null>): string[] {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

async function sourceCredentialIds(
  prisma: ExpenseCredentialDb,
  input: ExpenseCredentialInput,
): Promise<string[]> {
  const [plan, service] = await Promise.all([
    input.expensePlanId
      ? prisma.expensePlan.findUnique({
          where: { id: input.expensePlanId },
          select: { credentialId: true },
        })
      : null,
    input.clientServiceRecordId
      ? prisma.clientServiceRecord.findUnique({
          where: { id: input.clientServiceRecordId },
          select: { providerAccountId: true },
        })
      : null,
  ]);

  return uniqueIds([plan?.credentialId ?? null, service?.providerAccountId ?? null]);
}

/** Resolves optional Vault credential for an expense plan or card. */
export async function resolveExpenseCredentialId(
  prisma: ExpenseCredentialDb,
  input: ExpenseCredentialInput,
): Promise<string | null> {
  const explicit = trimId(input.credentialId);
  const fromSources = await sourceCredentialIds(prisma, input);
  const candidates = uniqueIds([explicit, ...fromSources]);

  if (candidates.length > 1) {
    throw new BadRequestException(CREDENTIAL_CONFLICT);
  }

  const credentialId = candidates[0] ?? null;
  if (!credentialId) return null;

  const credential = await prisma.credential.findUnique({
    where: { id: credentialId },
    select: { id: true, productId: true, clientServiceRecordId: true, trashedAt: true },
  });
  if (!credential || credential.trashedAt) {
    throw new BadRequestException(CREDENTIAL_MISSING);
  }

  return credential.id;
}

/** Fills empty credential product / client-service context. Does not overwrite. */
export async function fillCredentialContextIfEmpty(
  prisma: ExpenseCredentialDb,
  credentialId: string | null,
  context: { productId?: string | null; clientServiceRecordId?: string | null },
): Promise<void> {
  if (!credentialId) return;

  const credential = await prisma.credential.findUnique({
    where: { id: credentialId },
    select: { id: true, productId: true, clientServiceRecordId: true, trashedAt: true },
  });
  if (!credential || credential.trashedAt) return;

  const productId = trimId(context.productId);
  const serviceId = trimId(context.clientServiceRecordId);
  const data: { productId?: string; clientServiceRecordId?: string } = {};
  if (!credential.productId && productId) data.productId = productId;
  if (!credential.clientServiceRecordId && serviceId) data.clientServiceRecordId = serviceId;
  if (!data.productId && !data.clientServiceRecordId) return;

  await prisma.credential.update({ where: { id: credentialId }, data });
}
