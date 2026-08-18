import { BadRequestException } from '@nestjs/common';
import { isWhatsAppGroupChatId, normalizeWhatsAppGroupChatId } from '@nbos/shared';
import type { PrismaClient } from '@nbos/database';

export const WHATSAPP_WON_GATE_DEAL_TYPES = new Set(['PRODUCT', 'OUTSOURCE']);

/** Operation statuses that mean the employee already asked NBOS to create. */
export const CREATE_PRODUCT_GROUP_OP_STATUSES = [
  'PENDING',
  'QUEUED',
  'PROCESSING',
  'FAILED',
  'SUCCEEDED',
  'OUTCOME_UNKNOWN',
] as const;

export type DealWonWhatsAppAction = 'create' | 'bind';

export interface DealWonWhatsAppIntent {
  action: DealWonWhatsAppAction;
  groupChatId?: string;
  actorId?: string;
}

export interface DealWonWhatsAppContext {
  productId: string | null;
  groupChatId: string | null;
  hasCreateOperation: boolean;
}

export interface DealWonWhatsAppGateInput extends DealWonWhatsAppContext {
  dealType: string | null;
  whatsappAction?: DealWonWhatsAppAction | null;
  whatsappGroupChatId?: string | null;
}

export function resolveDealProductIdForWhatsApp(deal: {
  existingProductId?: string | null;
  orders?: Array<{ productId?: string | null }>;
}): string | null {
  if (deal.existingProductId) return deal.existingProductId;
  const order = deal.orders?.find((row) => Boolean(row.productId));
  return order?.productId ?? null;
}

export function isWhatsAppWonGateDealType(dealType: string | null | undefined): boolean {
  return Boolean(dealType && WHATSAPP_WON_GATE_DEAL_TYPES.has(dealType));
}

export function getDealWonWhatsAppErrors(input: DealWonWhatsAppGateInput): Array<{
  field: string;
  message: string;
}> {
  if (!isWhatsAppWonGateDealType(input.dealType)) return [];

  if (input.groupChatId) return [];
  if (input.hasCreateOperation) return [];

  if (input.whatsappAction === 'create') return [];
  if (input.whatsappAction === 'bind') {
    const normalized = normalizeWhatsAppGroupChatId(input.whatsappGroupChatId ?? '');
    if (isWhatsAppGroupChatId(normalized)) return [];
    return [
      {
        field: 'whatsapp',
        message: 'Paste a WhatsApp group ID ending in @g.us, or create a group, before Deal Won.',
      },
    ];
  }

  return [
    {
      field: 'whatsapp',
      message:
        'Create a WhatsApp group or save an existing group ID before marking this deal as Won.',
    },
  ];
}

export function validateDealWonWhatsAppGate(input: DealWonWhatsAppGateInput): void {
  const errors = getDealWonWhatsAppErrors(input);
  if (errors.length === 0) return;

  throw new BadRequestException({
    statusCode: 400,
    code: 'STAGE_GATE_VALIDATION',
    message: 'Deal cannot move to WON: WhatsApp group create or ID is required',
    errors,
  });
}

export async function loadDealWonWhatsAppContext(
  prisma: InstanceType<typeof PrismaClient>,
  deal: { existingProductId?: string | null; orders?: Array<{ productId?: string | null }> },
): Promise<DealWonWhatsAppContext> {
  const productId = resolveDealProductIdForWhatsApp(deal);
  if (!productId) {
    return { productId: null, groupChatId: null, hasCreateOperation: false };
  }

  const [binding, createOp] = await Promise.all([
    prisma.productWhatsAppGroupBinding.findUnique({
      where: { productId },
      select: { groupChatId: true },
    }),
    prisma.whatsAppGroupOperation.findFirst({
      where: {
        productId,
        type: 'CREATE_PRODUCT_GROUP',
        status: { in: [...CREATE_PRODUCT_GROUP_OP_STATUSES] },
      },
      select: { id: true },
    }),
  ]);

  return {
    productId,
    groupChatId: binding?.groupChatId ?? null,
    hasCreateOperation: Boolean(createOp),
  };
}
