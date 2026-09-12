import { describe, expect, it } from 'vitest';
import { formatTaskChatDateLabel } from './task-sheet-format';

describe('formatTaskChatDateLabel', () => {
  const now = new Date('2026-09-12T12:00:00.000Z');

  it('uses today and yesterday labels', () => {
    expect(formatTaskChatDateLabel(now.toISOString(), 'en-US', 'Today', 'Yesterday', now)).toBe(
      'Today',
    );
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    expect(
      formatTaskChatDateLabel(yesterday.toISOString(), 'en-US', 'Today', 'Yesterday', now),
    ).toBe('Yesterday');
  });
});
