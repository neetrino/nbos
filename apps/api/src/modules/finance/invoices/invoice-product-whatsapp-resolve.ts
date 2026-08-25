import type { PrismaClient } from '@nbos/database';

/**
 * Resolves Product WhatsApp group target for invoice / subscription client reminders.
 * Prefer Subscription.productId, then Order.productId. Never Project-level groups.
 */
export async function resolveInvoiceProductWhatsAppGroup(
  prisma: InstanceType<typeof PrismaClient>,
  invoiceId: string,
): Promise<{ productId: string; groupChatId: string } | null> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      subscription: { select: { productId: true } },
      order: { select: { productId: true } },
      clientServiceRecord: { select: { productId: true } },
    },
  });
  if (!invoice) return null;

  const productId =
    invoice.subscription?.productId ??
    invoice.clientServiceRecord?.productId ??
    invoice.order?.productId ??
    null;
  if (!productId) return null;

  const binding = await prisma.productWhatsAppGroupBinding.findUnique({
    where: { productId },
    select: { groupChatId: true, status: true },
  });
  if (!binding?.groupChatId || binding.status !== 'ACTIVE') return null;

  return { productId, groupChatId: binding.groupChatId };
}
