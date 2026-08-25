import { WHATSAPP_OUTBOUND_GAP_MS } from './whatsapp-gateway.constants';

export function waitWhatsAppOutboundGap(ms: number = WHATSAPP_OUTBOUND_GAP_MS): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
