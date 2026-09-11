import type { DealWhatsAppQuickAction } from './deal-whatsapp-quick-action';

export const DEAL_WHATSAPP_HEADER_LABEL = 'WhatsApp';

export type DealWhatsAppHeaderMode = 'direct' | 'menu' | 'disabled';
export type DealWhatsAppHeaderTone = 'default' | 'muted' | 'danger' | 'pending';

export type DealWhatsAppHeaderPresentation = {
  mode: DealWhatsAppHeaderMode;
  tone: DealWhatsAppHeaderTone;
  triggerLabel: string;
  triggerTitle?: string;
  directAction?: DealWhatsAppQuickAction;
  items: DealWhatsAppQuickAction[];
};

export function resolveDealWhatsAppHeaderPresentation(
  actions: DealWhatsAppQuickAction[],
): DealWhatsAppHeaderPresentation {
  const enabled = actions.filter((action) => action.enabled);
  const primary = enabled[0] ?? actions[0];
  if (!primary || enabled.length === 0) {
    return {
      mode: 'disabled',
      tone: primary?.label.startsWith('Creating') ? 'pending' : 'muted',
      triggerLabel: DEAL_WHATSAPP_HEADER_LABEL,
      triggerTitle: primary?.disabledTitle ?? primary?.label ?? DEAL_WHATSAPP_HEADER_LABEL,
      items: actions,
    };
  }
  if (enabled.length === 1) {
    return {
      mode: 'direct',
      tone: toneForAction(primary),
      triggerLabel: DEAL_WHATSAPP_HEADER_LABEL,
      triggerTitle: primary.title ?? primary.label,
      directAction: primary,
      items: actions,
    };
  }
  return {
    mode: 'menu',
    tone: 'default',
    triggerLabel: DEAL_WHATSAPP_HEADER_LABEL,
    triggerTitle: DEAL_WHATSAPP_HEADER_LABEL,
    items: actions,
  };
}

function toneForAction(action: DealWhatsAppQuickAction): DealWhatsAppHeaderTone {
  if (action.id === 'whatsapp-retry') return 'danger';
  if (action.label.startsWith('Creating')) return 'pending';
  return 'default';
}
