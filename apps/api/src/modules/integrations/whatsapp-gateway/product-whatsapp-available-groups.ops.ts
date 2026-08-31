import type { PrismaClient } from '@nbos/database';
import { resolveWhatsAppAccountantGroupChatId } from '../../messenger/core/product-communication-account';
import { resolveClientDestination } from '../../messenger/core/product-communication-resolver';
import type { WhatsAppGatewayGroupSummary } from './whatsapp-gateway.types';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type SelectableWhatsAppGroup = WhatsAppGatewayGroupSummary & {
  missingFromGateway?: boolean;
  inProjectContext?: boolean;
};

export async function listSelectableProductGroups(
  prisma: PrismaLike,
  input: {
    productId: string;
    gatewayGroups: WhatsAppGatewayGroupSummary[];
    currentGroupChatId: string | null;
    currentGroupName: string | null;
  },
): Promise<{ groups: SelectableWhatsAppGroup[]; currentGroupChatId: string | null }> {
  const accountant = await resolveWhatsAppAccountantGroupChatId(prisma);
  const projectChatIds = await loadProjectScopedChatIds(prisma, input.productId);
  const groups = input.gatewayGroups
    .filter((group) => group.id !== accountant)
    .map((group) => ({ ...group, inProjectContext: projectChatIds.has(group.id) }));
  prependCurrentIfMissing(groups, input.currentGroupChatId, input.currentGroupName, projectChatIds);
  groups.sort(
    (left, right) =>
      Number(Boolean(right.inProjectContext)) - Number(Boolean(left.inProjectContext)),
  );
  return { groups, currentGroupChatId: input.currentGroupChatId };
}

async function loadProjectScopedChatIds(
  prisma: PrismaLike,
  productId: string,
): Promise<Set<string>> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { projectId: true },
  });
  if (!product) return new Set();
  const siblings = await prisma.product.findMany({
    where: { projectId: product.projectId },
    select: { id: true },
  });
  const ids = new Set<string>();
  for (const sibling of siblings) {
    const work = await resolveClientDestination(prisma, sibling.id, 'WORK');
    if (work) ids.add(work.groupChatId);
    const finance = await resolveClientDestination(prisma, sibling.id, 'FINANCE');
    if (finance && !finance.fallbackFromWork) ids.add(finance.groupChatId);
  }
  return ids;
}

function prependCurrentIfMissing(
  groups: SelectableWhatsAppGroup[],
  currentGroupChatId: string | null,
  currentGroupName: string | null,
  projectChatIds: Set<string>,
): void {
  if (!currentGroupChatId || groups.some((group) => group.id === currentGroupChatId)) return;
  groups.unshift({
    id: currentGroupChatId,
    name: currentGroupName ?? currentGroupChatId,
    participantCount: null,
    pictureUrl: null,
    missingFromGateway: true,
    inProjectContext: projectChatIds.has(currentGroupChatId),
  });
}
