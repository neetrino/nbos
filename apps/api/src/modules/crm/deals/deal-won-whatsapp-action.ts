import { Logger } from '@nestjs/common';
import { normalizeWhatsAppGroupChatId } from '@nbos/shared';
import type { ProductWhatsAppGroupService } from '../../integrations/whatsapp-gateway/product-whatsapp-group.service';
import type { DealWonWhatsAppIntent } from './deal-won-whatsapp';

/**
 * PRODUCT/OUTSOURCE often have no Product until Won creates the shell.
 * PATCH /status already accepts optional extras; when no product exists yet the
 * client sends `whatsappAction: create | bind` and this runs after `ensureProduct`.
 * When a product already exists, the modal uses ensure/bind APIs first and this
 * payload is a fallback for the same Won transaction.
 */
export async function applyDealWonWhatsAppAction(
  productWhatsApp: ProductWhatsAppGroupService,
  input: {
    productId: string;
    dealId: string;
    intent: DealWonWhatsAppIntent;
    logger: Logger;
  },
): Promise<void> {
  try {
    if (input.intent.action === 'create') {
      await productWhatsApp.ensureGroupForProduct(input.productId, {
        source: 'DEAL_WON',
        contextDealId: input.dealId,
        actorId: input.intent.actorId,
      });
      return;
    }

    const groupChatId = normalizeWhatsAppGroupChatId(input.intent.groupChatId ?? '');
    if (!groupChatId) return;

    await productWhatsApp.bindExistingGroup(
      input.productId,
      groupChatId,
      input.intent.actorId ?? input.dealId,
      { persistIfUnreachable: true },
    );
  } catch (error) {
    input.logger.warn(
      `WhatsApp ${input.intent.action} after deal ${input.dealId} product ${input.productId} failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
