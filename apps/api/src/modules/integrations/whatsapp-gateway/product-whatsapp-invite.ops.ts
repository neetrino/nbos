import type { PrismaClient } from '@nbos/database';
import { buildProductWhatsAppClientInviteDedupeKey } from '@nbos/shared';
import { loadProductWorkLegacyPlan } from '../../messenger/core/product-communication-legacy-destination';
import { WHATSAPP_ERROR } from './whatsapp-gateway.constants';
import { throwWhatsAppDomainError } from './whatsapp-gateway.errors';
import type { EnqueueExistingWhatsAppOp } from './product-whatsapp-ensure-work.ops';

type PrismaLike = InstanceType<typeof PrismaClient>;

/**
 * Queues SEND_CLIENT_INVITE only when unique-legacy matches resolver WORK
 * and is not the accountant JID. Shared / stale / accountant unique-legacy no-ops
 * when WORK exists so a second invite is not sent.
 */
export async function queueProductClientInvitation(
  prisma: PrismaLike,
  enqueueExisting: EnqueueExistingWhatsAppOp,
  productId: string,
  actorId: string,
  options?: { forceResend?: boolean },
): Promise<void> {
  const plan = await loadProductWorkLegacyPlan(prisma, productId);
  if (!plan.usableLegacy) {
    if (plan.workGroupChatId) return;
    throwWhatsAppDomainError(
      400,
      WHATSAPP_ERROR.PRODUCT_GROUP_NOT_FOUND,
      'Active WhatsApp group binding is required',
    );
  }
  const contactId = await loadInviteContactId(prisma, productId);
  await enqueueInviteForContact(prisma, enqueueExisting, {
    productId,
    actorId,
    bindingId: plan.usableLegacy.id,
    groupChatId: plan.workGroupChatId ?? plan.usableLegacy.groupChatId,
    contactId,
    forceResend: options?.forceResend === true,
  });
}

async function loadInviteContactId(prisma: PrismaLike, productId: string): Promise<string> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      contactId: true,
      project: { select: { contactId: true } },
      order: { select: { deal: { select: { contactId: true } } } },
    },
  });
  const contactId =
    product?.contactId ?? product?.project.contactId ?? product?.order?.deal?.contactId ?? null;
  if (!contactId) {
    throwWhatsAppDomainError(
      400,
      WHATSAPP_ERROR.CLIENT_CONTACT_NOT_FOUND,
      'No primary client contact found for invitation',
    );
  }
  return contactId;
}

async function enqueueInviteForContact(
  prisma: PrismaLike,
  enqueueExisting: EnqueueExistingWhatsAppOp,
  input: {
    productId: string;
    actorId: string;
    bindingId: string;
    groupChatId: string;
    contactId: string;
    forceResend: boolean;
  },
): Promise<void> {
  const dedupeKey = buildProductWhatsAppClientInviteDedupeKey(
    input.productId,
    input.contactId,
    input.groupChatId,
  );
  const existing = await prisma.productWhatsAppClientInvitation.findUnique({
    where: { dedupeKey },
  });
  if (existing?.status === 'SENT' && !input.forceResend) return;
  if (existing?.status === 'OUTCOME_UNKNOWN' && !input.forceResend) {
    throwWhatsAppDomainError(
      409,
      WHATSAPP_ERROR.CLIENT_INVITE_OUTCOME_UNKNOWN,
      'Previous invite outcome is unknown; confirm resend',
    );
  }
  const invitation = await upsertPendingInvitation(prisma, existing?.id, {
    productId: input.productId,
    bindingId: input.bindingId,
    contactId: input.contactId,
    dedupeKey,
  });
  await createInviteOperation(prisma, enqueueExisting, input, invitation.id, dedupeKey);
}

async function createInviteOperation(
  prisma: PrismaLike,
  enqueueExisting: EnqueueExistingWhatsAppOp,
  input: {
    productId: string;
    actorId: string;
    bindingId: string;
    contactId: string;
    forceResend: boolean;
  },
  invitationId: string,
  dedupeKey: string,
): Promise<void> {
  const opKey = input.forceResend
    ? `${dedupeKey}:resend:${Date.now()}`
    : `whatsapp-product-group:invite-op:${invitationId}`;
  const operation = await prisma.whatsAppGroupOperation.create({
    data: {
      productId: input.productId,
      bindingId: input.bindingId,
      type: 'SEND_CLIENT_INVITE',
      status: 'PENDING',
      dedupeKey: opKey,
      source: 'MANUAL_INVITE',
      requestedById: input.actorId,
      safePayload: { invitationId, contactId: input.contactId },
    },
  });
  await enqueueExisting(operation.id, opKey, false);
}

async function upsertPendingInvitation(
  prisma: PrismaLike,
  existingId: string | undefined,
  data: { productId: string; bindingId: string; contactId: string; dedupeKey: string },
): Promise<{ id: string }> {
  if (existingId) {
    return prisma.productWhatsAppClientInvitation.update({
      where: { id: existingId },
      data: { status: 'PENDING', lastErrorCode: null, lastErrorMessage: null },
      select: { id: true },
    });
  }
  return prisma.productWhatsAppClientInvitation.create({
    data: {
      productId: data.productId,
      bindingId: data.bindingId,
      contactId: data.contactId,
      status: 'PENDING',
      dedupeKey: data.dedupeKey,
    },
    select: { id: true },
  });
}
