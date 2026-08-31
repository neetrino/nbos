import type { PrismaClient } from '@nbos/database';
import { resolveClientDestination } from '../../messenger/core/product-communication-resolver';

/**
 * Resolves Product WhatsApp destination for client billing reminders.
 * Prefer Subscription.productId, then Client Service Record.productId, then Order.productId.
 * Destination is FINANCE with WORK fallback (M-WA-05). Official accountant group is separate.
 */
export async function resolveInvoiceProductWhatsAppGroup(
  prisma: InstanceType<typeof PrismaClient>,
  invoiceId: string,
): Promise<{ productId: string; groupChatId: string } | null> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      subscription: { select: { productId: true } },
      clientServiceRecord: { select: { productId: true } },
      order: { select: { productId: true } },
    },
  });
  if (!invoice) return null;

  const productId =
    invoice.subscription?.productId ??
    invoice.clientServiceRecord?.productId ??
    invoice.order?.productId ??
    null;
  if (!productId) return null;

  const destination = await resolveClientDestination(prisma, productId, 'FINANCE');
  if (!destination) return null;
  return { productId, groupChatId: destination.groupChatId };
}
