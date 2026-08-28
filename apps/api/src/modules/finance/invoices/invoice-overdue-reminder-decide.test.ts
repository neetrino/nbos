import { describe, expect, it } from 'vitest';
import { decideOverdueReminderAction } from './invoice-overdue-reminder-decide';

const BASE = {
  moneyStatus: 'OVERDUE',
  hasProductLink: true,
  notificationsEnabled: true,
  taxBlocked: false,
  hasWhatsAppGroup: true,
  wave1ScheduledFor: null as Date | null,
  hasWave2: false,
  asOfKey: '2026-08-08',
};

describe('decideOverdueReminderAction', () => {
  it('sends wave 1 when no overdue job exists', () => {
    expect(decideOverdueReminderAction(BASE)).toEqual({ kind: 'send', wave: 1 });
  });

  it('sends wave 2 when wave 1 was at least one Yerevan day ago', () => {
    expect(
      decideOverdueReminderAction({
        ...BASE,
        wave1ScheduledFor: new Date('2026-08-07T12:00:00+04:00'),
      }),
    ).toEqual({ kind: 'send', wave: 2 });
  });

  it('skips same_day when wave 1 was sent today', () => {
    expect(
      decideOverdueReminderAction({
        ...BASE,
        wave1ScheduledFor: new Date('2026-08-08T09:00:00+04:00'),
      }),
    ).toEqual({ kind: 'skip', reason: 'same_day' });
  });

  it('skips max_wave after wave 2', () => {
    expect(
      decideOverdueReminderAction({
        ...BASE,
        wave1ScheduledFor: new Date('2026-08-05T12:00:00+04:00'),
        hasWave2: true,
      }),
    ).toEqual({ kind: 'skip', reason: 'max_wave' });
  });

  it('skips paid / hold / cancelled as not_overdue', () => {
    expect(decideOverdueReminderAction({ ...BASE, moneyStatus: 'PAID' })).toEqual({
      kind: 'skip',
      reason: 'not_overdue',
    });
    expect(decideOverdueReminderAction({ ...BASE, moneyStatus: 'ON_HOLD' })).toEqual({
      kind: 'skip',
      reason: 'not_overdue',
    });
  });

  it('skips notify off, tax gate, no WhatsApp, deal-only', () => {
    expect(decideOverdueReminderAction({ ...BASE, notificationsEnabled: false })).toEqual({
      kind: 'skip',
      reason: 'notifications_off',
    });
    expect(decideOverdueReminderAction({ ...BASE, taxBlocked: true })).toEqual({
      kind: 'skip',
      reason: 'tax_gate',
    });
    expect(decideOverdueReminderAction({ ...BASE, hasWhatsAppGroup: false })).toEqual({
      kind: 'skip',
      reason: 'no_whatsapp',
    });
    expect(decideOverdueReminderAction({ ...BASE, hasProductLink: false })).toEqual({
      kind: 'skip',
      reason: 'no_product_link',
    });
  });
});
