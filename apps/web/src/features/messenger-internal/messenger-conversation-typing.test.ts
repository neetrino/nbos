import { describe, expect, it } from 'vitest';
import { parseConversationTyping } from './messenger-conversation-typing';

describe('parseConversationTyping', () => {
  it('accepts a complete payload', () => {
    expect(
      parseConversationTyping({
        conversationId: 'c1',
        employeeId: 'e1',
        label: 'Liana',
      }),
    ).toEqual({ conversationId: 'c1', employeeId: 'e1', label: 'Liana' });
  });

  it('rejects a missing label', () => {
    expect(
      parseConversationTyping({ conversationId: 'c1', employeeId: 'e1', label: '  ' }),
    ).toBeNull();
  });
});
