import type { PrismaClient } from '@nbos/database';
import { resolveClientDestination } from '../../messenger/core/product-communication-resolver';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type ProductCommunicationDestinationView = {
  conversationId: string;
  groupChatId: string;
  fallbackFromWork: boolean;
};

export type ProductWhatsAppBindingView = {
  id: string | null;
  groupChatId: string | null;
  groupName: string | null;
  status: string;
  lastSuccessfulSyncAt: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
};

export async function loadProductCommunicationViews(
  prisma: PrismaLike,
  productId: string,
): Promise<{
  work: ProductCommunicationDestinationView | null;
  finance: ProductCommunicationDestinationView | null;
  financeUsesWork: boolean;
}> {
  const work = await resolveClientDestination(prisma, productId, 'WORK');
  const finance = await resolveClientDestination(prisma, productId, 'FINANCE');
  return {
    work: work ? toView(work) : null,
    finance: finance ? toView(finance) : null,
    financeUsesWork: Boolean(finance?.fallbackFromWork) || (!finance && Boolean(work)),
  };
}

export async function loadProductWhatsAppState(prisma: PrismaLike, productId: string) {
  const [binding, destinations] = await Promise.all([
    prisma.productWhatsAppGroupBinding.findUnique({ where: { productId } }),
    loadProductCommunicationViews(prisma, productId),
  ]);
  const extras = await loadWhatsAppStateExtras(prisma, productId, binding?.id ?? null);
  return {
    productId,
    binding: toBindingView(binding, destinations.work),
    work: destinations.work,
    finance: destinations.finance,
    financeUsesWork: destinations.financeUsesWork,
    ...extras,
  };
}

type UniqueLegacyBindingRow = {
  id: string;
  groupChatId: string | null;
  groupName: string | null;
  status: string;
  lastSuccessfulSyncAt: Date | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
};

async function loadWhatsAppStateExtras(
  prisma: PrismaLike,
  productId: string,
  bindingId: string | null,
) {
  const latestOperation = await prisma.whatsAppGroupOperation.findFirst({
    where: { productId },
    orderBy: { createdAt: 'desc' },
  });
  const participants = bindingId
    ? await prisma.productWhatsAppParticipantSync.findMany({
        where: { bindingId },
        select: { employeeId: true, status: true, sourceRoles: true, lastErrorCode: true },
      })
    : [];
  const invitation = bindingId
    ? await prisma.productWhatsAppClientInvitation.findFirst({
        where: { bindingId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          contactId: true,
          attemptCount: true,
          sentAt: true,
          lastErrorCode: true,
          lastErrorMessage: true,
        },
      })
    : null;
  return {
    participants,
    invitation,
    latestOperation: latestOperation
      ? {
          id: latestOperation.id,
          type: latestOperation.type,
          status: latestOperation.status,
          errorCode: latestOperation.errorCode,
          errorMessage: latestOperation.errorMessage,
          createdAt: latestOperation.createdAt.toISOString(),
          completedAt: latestOperation.completedAt?.toISOString() ?? null,
        }
      : null,
  };
}

function toBindingView(
  binding: UniqueLegacyBindingRow | null,
  work: ProductCommunicationDestinationView | null,
): ProductWhatsAppBindingView | null {
  if (binding) return uniqueLegacyBindingView(binding, work);
  if (!work) return null;
  return {
    id: null,
    groupChatId: work.groupChatId,
    groupName: null,
    status: 'ACTIVE',
    lastSuccessfulSyncAt: null,
    lastErrorCode: null,
    lastErrorMessage: null,
  };
}

/** Never present leftover unique-legacy as current; overlay resolver WORK only. */
function uniqueLegacyBindingView(
  binding: UniqueLegacyBindingRow,
  work: ProductCommunicationDestinationView | null,
): ProductWhatsAppBindingView {
  if (work) return uniqueLegacyWithWorkView(binding, work);
  return {
    id: binding.id,
    groupChatId: null,
    groupName: binding.groupName,
    status: binding.status,
    lastSuccessfulSyncAt: binding.lastSuccessfulSyncAt?.toISOString() ?? null,
    lastErrorCode: binding.lastErrorCode,
    lastErrorMessage: binding.lastErrorMessage,
  };
}

function uniqueLegacyWithWorkView(
  binding: UniqueLegacyBindingRow,
  work: ProductCommunicationDestinationView,
): ProductWhatsAppBindingView {
  const matchesWork = binding.groupChatId === work.groupChatId;
  return {
    id: binding.id,
    groupChatId: work.groupChatId,
    groupName: matchesWork ? binding.groupName : null,
    status: 'ACTIVE',
    lastSuccessfulSyncAt: matchesWork
      ? (binding.lastSuccessfulSyncAt?.toISOString() ?? null)
      : null,
    lastErrorCode: matchesWork ? binding.lastErrorCode : null,
    lastErrorMessage: matchesWork ? binding.lastErrorMessage : null,
  };
}

function toView(row: {
  conversationId: string;
  groupChatId: string;
  fallbackFromWork: boolean;
}): ProductCommunicationDestinationView {
  return {
    conversationId: row.conversationId,
    groupChatId: row.groupChatId,
    fallbackFromWork: row.fallbackFromWork,
  };
}
