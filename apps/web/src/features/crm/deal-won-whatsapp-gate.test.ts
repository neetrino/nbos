import { describe, expect, it } from 'vitest';
import {
  canConfirmDealWonWhatsApp,
  isMissingActiveWhatsAppGroup,
  isWhatsAppWonGateDealType,
  whatsappGroupMissingLabel,
  whatsappGroupMissingShortLabel,
} from './deal-won-whatsapp-gate';

describe('deal-won-whatsapp-gate', () => {
  it('gates only PRODUCT and OUTSOURCE', () => {
    expect(isWhatsAppWonGateDealType('PRODUCT')).toBe(true);
    expect(isWhatsAppWonGateDealType('OUTSOURCE')).toBe(true);
    expect(isWhatsAppWonGateDealType('MAINTENANCE')).toBe(false);
    expect(isWhatsAppWonGateDealType('EXTENSION')).toBe(false);
  });

  it('requires create or ID before Mark as Won', () => {
    expect(
      canConfirmDealWonWhatsApp({
        dealType: 'PRODUCT',
        sessionAction: null,
      }),
    ).toBe(false);
  });

  it('allows after session create, FAILED create op, or persisted id', () => {
    expect(
      canConfirmDealWonWhatsApp({
        dealType: 'PRODUCT',
        sessionAction: 'create',
      }),
    ).toBe(true);
    expect(
      canConfirmDealWonWhatsApp({
        dealType: 'PRODUCT',
        createOperationStatus: 'FAILED',
      }),
    ).toBe(true);
    expect(
      canConfirmDealWonWhatsApp({
        dealType: 'OUTSOURCE',
        groupChatId: '120363012345678901@g.us',
      }),
    ).toBe(true);
  });

  it('leaves MAINTENANCE unchanged', () => {
    expect(canConfirmDealWonWhatsApp({ dealType: 'MAINTENANCE' })).toBe(true);
  });

  it('labels missing and FAILED groups unmistakably', () => {
    expect(isMissingActiveWhatsAppGroup({ bindingStatus: null })).toBe(true);
    expect(isMissingActiveWhatsAppGroup({ bindingStatus: 'FAILED' })).toBe(true);
    expect(
      isMissingActiveWhatsAppGroup({
        bindingStatus: 'ACTIVE',
        groupChatId: '120363012345678901@g.us',
      }),
    ).toBe(false);
    expect(whatsappGroupMissingLabel('FAILED')).toBe('WhatsApp group failed');
    expect(whatsappGroupMissingLabel(null)).toBe('WhatsApp group not created');
    expect(whatsappGroupMissingShortLabel(null)).toBe('WhatsApp');
    expect(whatsappGroupMissingShortLabel('FAILED')).toBe('Failed');
    expect(whatsappGroupMissingShortLabel('CREATING')).toBe('Creating…');
    expect(whatsappGroupMissingShortLabel('NEEDS_RECONCILIATION')).toBe('Unresolved');
  });
});
