import { resolveWorkTransportChatId } from '../messenger/core/product-communication-legacy-destination';

export type ProductWorkCommunicationBinding = {
  conversation: {
    externalMappings: Array<{ externalConversationId: string }>;
  };
};

export type ProductWhatsAppListFields = {
  whatsappGroupBinding?: { status: string; groupChatId: string | null } | null;
  communicationBindings?: ProductWorkCommunicationBinding[];
};

/**
 * Project list overlay: resolver WORK groupChatId wins over unique-legacy.
 * Mapping JID that equals the accountant group is not Product WORK.
 */
export function overlayProductWorkWhatsAppList<T extends ProductWhatsAppListFields>(
  product: T,
  accountantGroupChatId: string | null,
): Omit<T, 'communicationBindings'> {
  const { communicationBindings, ...rest } = product;
  const mapped =
    communicationBindings?.[0]?.conversation.externalMappings[0]?.externalConversationId ?? null;
  const workChat = resolveWorkTransportChatId(mapped, accountantGroupChatId);
  if (workChat) {
    return {
      ...rest,
      whatsappGroupBinding: { status: 'ACTIVE', groupChatId: workChat },
    };
  }
  if (!rest.whatsappGroupBinding?.groupChatId) return rest;
  return {
    ...rest,
    whatsappGroupBinding: { ...rest.whatsappGroupBinding, groupChatId: null },
  };
}
