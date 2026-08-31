import { PrismaClient } from '@nbos/database';
import {
  buildProductWhatsAppFinanceCreateDedupeKey,
  buildProductWhatsAppGroupName,
} from '@nbos/shared';
import { persistBoundDestination } from './product-whatsapp-bind.ops';
import { WhatsAppGatewayClient } from './whatsapp-gateway.client';
import { WhatsAppGatewayConnectionService } from './whatsapp-gateway-connection.service';
import { ProductWhatsAppParticipantResolver } from './product-whatsapp-participant.resolver';
import { WhatsAppGatewayHttpError, isUnknownCreateOutcome } from './whatsapp-gateway.errors';

type PrismaLike = InstanceType<typeof PrismaClient>;

const FINANCE_GROUP_LABEL = 'Finance';

export async function executeFinanceGroupCreate(input: {
  prisma: PrismaLike;
  client: WhatsAppGatewayClient;
  connection: WhatsAppGatewayConnectionService;
  participants: ProductWhatsAppParticipantResolver;
  operationId: string;
}): Promise<'ok' | 'unknown' | 'no_participants' | 'failed'> {
  const operation = await input.prisma.whatsAppGroupOperation.findUniqueOrThrow({
    where: { id: input.operationId },
  });
  const product = await input.prisma.product.findUniqueOrThrow({
    where: { id: operation.productId },
    select: { id: true, name: true, project: { select: { name: true } } },
  });
  const resolved = await input.participants.resolve(product.id, operation.contextDealId);
  if (resolved.candidates.length === 0) return 'no_participants';
  const created = await createFinanceGatewayGroup(input, product, resolved.candidates);
  if (created === 'unknown' || created === 'failed') return created;
  await persistBoundDestination(input.prisma, {
    productId: product.id,
    purpose: 'FINANCE',
    groupChatId: created.id,
    groupName: created.name,
    replace: true,
    createdFromDealId: operation.contextDealId,
  });
  return 'ok';
}

async function createFinanceGatewayGroup(
  input: {
    client: WhatsAppGatewayClient;
    connection: WhatsAppGatewayConnectionService;
  },
  product: { id: string; name: string; project: { name: string } },
  candidates: Array<{ jid: string }>,
): Promise<{ id: string; name: string } | 'unknown' | 'failed'> {
  const config = await input.connection.requireClientConfig();
  const name = buildProductWhatsAppGroupName(
    product.project.name,
    `${product.name} ${FINANCE_GROUP_LABEL}`,
  );
  try {
    return await input.client.createGroup(
      config,
      { name, participants: candidates.map((row) => row.jid) },
      buildProductWhatsAppFinanceCreateDedupeKey(product.id),
    );
  } catch (error) {
    if (error instanceof WhatsAppGatewayHttpError && isUnknownCreateOutcome(error.code)) {
      return 'unknown';
    }
    if (error instanceof WhatsAppGatewayHttpError) return 'failed';
    throw error;
  }
}
