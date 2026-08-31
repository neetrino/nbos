import { describe, expect, it } from 'vitest';
import { canonicalSourceMessageIds } from './canonical-source-message-ids';

describe('canonicalSourceMessageIds', () => {
  it('returns FORWARD sourceMessageIds in sortOrder, not the holder id', () => {
    const holder = {
      id: 'hold-1',
      references: [
        { purpose: 'FORWARD' as const, sourceMessageId: 'src-b', sortOrder: 1 },
        { purpose: 'FORWARD' as const, sourceMessageId: 'src-a', sortOrder: 0 },
        { purpose: 'TASK_SOURCE' as const, sourceMessageId: 'src-task', sortOrder: 0 },
      ],
    };
    expect(canonicalSourceMessageIds(holder)).toEqual(['src-a', 'src-b']);
    expect(canonicalSourceMessageIds(holder)).not.toContain('hold-1');
  });

  it('returns the message id when there are no FORWARD references', () => {
    expect(canonicalSourceMessageIds({ id: 'msg-1', references: [] })).toEqual(['msg-1']);
  });
});
