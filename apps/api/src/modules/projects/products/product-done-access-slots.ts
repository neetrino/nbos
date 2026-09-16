import type { PrismaClient } from '@nbos/database';
import {
  getMissingRequiredAccessSlotsForDone,
  isDomainConnectionSatisfied,
  type DomainConnectionMode,
  type DomainHeaderStatusInput,
} from '@nbos/shared';

export async function loadMissingRequiredAccessSlotKeys(
  prisma: InstanceType<typeof PrismaClient>,
  product: { id: string; productCategory: string; productType: string },
): Promise<string[]> {
  const bindings = await prisma.productAccessSlotBinding.findMany({
    where: { productId: product.id },
    select: { slotKey: true },
  });
  const missing = getMissingRequiredAccessSlotsForDone({
    productCategory: product.productCategory,
    productType: product.productType,
    boundSlotKeys: [...new Set(bindings.map((row) => row.slotKey))],
  });
  if (!missing.includes('DOMAIN')) return missing;
  if (await productHasSatisfiedDomainConnection(prisma, product.id)) {
    return missing.filter((key) => key !== 'DOMAIN');
  }
  return missing;
}

async function productHasSatisfiedDomainConnection(
  prisma: InstanceType<typeof PrismaClient>,
  productId: string,
): Promise<boolean> {
  const rows = await prisma.clientServiceRecord.findMany({
    where: { productId, type: 'DOMAIN', status: { not: 'CANCELLED' } },
    select: {
      name: true,
      status: true,
      connectionMode: true,
      providerAccountId: true,
      registrationConfirmedAt: true,
      connectionVerifiedAt: true,
      dnsInstructions: true,
    },
  });
  return (
    rows.length > 0 &&
    rows.every((row) => {
      if (!row.connectionMode) return false;
      const input: DomainHeaderStatusInput = {
        domainName: row.name,
        connectionMode: row.connectionMode as DomainConnectionMode,
        status: row.status,
        hasOpenInvoice: false,
        hasCredential: Boolean(row.providerAccountId),
        registrationConfirmed: Boolean(row.registrationConfirmedAt),
        connectionVerified: Boolean(row.connectionVerifiedAt),
        hasDnsInstructions: Boolean(row.dnsInstructions?.trim()),
      };
      return isDomainConnectionSatisfied(input);
    })
  );
}
