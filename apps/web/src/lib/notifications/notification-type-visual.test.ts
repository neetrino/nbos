import { describe, expect, it } from 'vitest';
import { Handshake, LifeBuoy, ListTodo, Mail, Shield, Wallet } from 'lucide-react';
import { getNotificationVisual } from './notification-type-visual';

describe('getNotificationVisual prefixes', () => {
  it('keeps mail and maps module prefixes to distinct icons', () => {
    expect(getNotificationVisual('mail.account_sync_stub').Icon).toBe(Mail);
    expect(getNotificationVisual('tasks.review.requested').Icon).toBe(ListTodo);
    expect(getNotificationVisual('task.overdue').Icon).toBe(ListTodo);
    expect(getNotificationVisual('finance.wallet.bonus_paid').Icon).toBe(Wallet);
    expect(getNotificationVisual('support.sla.resolve_warning').Icon).toBe(LifeBuoy);
    expect(getNotificationVisual('crm.deal.won').Icon).toBe(Handshake);
    expect(getNotificationVisual('credentials.high_risk_action').Icon).toBe(Shield);
    expect(getNotificationVisual('document.access_changed').Icon).toBe(Shield);
  });

  it('falls back to the generic bell for unknown types', () => {
    const visual = getNotificationVisual('unknown.event');
    expect(visual.iconClassName).toContain('bg-muted');
  });
});
