import { describe, expect, it } from 'vitest';
import {
  humanizeNotificationEventType,
  resolveNotificationEventTypeMessageKey,
} from './notification-event-type-labels';

describe('notification event type labels', () => {
  it('maps known codes to catalog keys', () => {
    expect(resolveNotificationEventTypeMessageKey('credentials.high_risk_action')).toBe(
      'eventTypes.credentialsHighRiskAction',
    );
  });

  it('humanizes unknown dotted codes', () => {
    expect(humanizeNotificationEventType('custom.foo_bar')).toBe('Foo bar');
  });
});
