import { describe, expect, it } from 'vitest';
import { isWhatsAppCreateInFlight, whatsappCreateButtonLabel } from './whatsapp-create-status';

describe('whatsapp-create-status', () => {
  it('treats queued and creating as in-flight', () => {
    expect(isWhatsAppCreateInFlight('PENDING')).toBe(true);
    expect(isWhatsAppCreateInFlight('QUEUED')).toBe(true);
    expect(isWhatsAppCreateInFlight('CREATING')).toBe(true);
    expect(isWhatsAppCreateInFlight('FAILED')).toBe(false);
    expect(isWhatsAppCreateInFlight('SUCCEEDED')).toBe(false);
    expect(isWhatsAppCreateInFlight(null)).toBe(false);
  });

  it('labels creating, retry, and idle', () => {
    expect(
      whatsappCreateButtonLabel({
        inFlight: true,
        failed: false,
        idleLabel: 'Create WhatsApp group',
      }),
    ).toBe('Creating group…');
    expect(
      whatsappCreateButtonLabel({
        inFlight: false,
        failed: true,
        idleLabel: 'Create group',
      }),
    ).toBe('Retry create group');
    expect(
      whatsappCreateButtonLabel({
        inFlight: false,
        failed: false,
        idleLabel: 'Create WhatsApp group',
      }),
    ).toBe('Create WhatsApp group');
  });
});
