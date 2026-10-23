import { describe, expect, it } from 'vitest';
import { canComposeConversationMessage } from './can-compose-conversation-message';

describe('canComposeConversationMessage', () => {
  it('lets a Task viewer post without Messenger write', () => {
    expect(canComposeConversationMessage({ type: 'TASK', canWrite: false })).toBe(true);
  });

  it('keeps a non-Task conversation closed when write is denied', () => {
    expect(canComposeConversationMessage({ type: 'INTERNAL_GROUP', canWrite: false })).toBe(false);
    expect(canComposeConversationMessage({ type: 'DIRECT' })).toBe(false);
  });

  it('keeps Messenger write for non-Task conversations', () => {
    expect(canComposeConversationMessage({ type: 'DIRECT', canWrite: true })).toBe(true);
  });
});
