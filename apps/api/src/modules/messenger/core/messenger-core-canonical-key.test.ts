import { describe, expect, it } from 'vitest';
import {
  dealCanonicalKey,
  directCanonicalKey,
  legacyChannelCanonicalKey,
  legacyMetaCanonicalKey,
  productCanonicalKey,
  projectGeneralCanonicalKey,
  taskCanonicalKey,
  whatsAppCanonicalKey,
  workspaceCanonicalKey,
} from './messenger-core-canonical-key';
import {
  channelLegacyIdentity,
  channelMessageLegacyIdentity,
  directMessageLegacyIdentity,
  directThreadLegacyIdentity,
  metaConversationLegacyIdentity,
  metaMessageLegacyIdentity,
  taskDiscussionEntryLegacyIdentity,
  taskLegacyIdentity,
} from './messenger-legacy-identity';

const LOW = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const HIGH = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

describe('messenger-core-canonical-key', () => {
  it('orders DIRECT pairs lexicographically', () => {
    expect(directCanonicalKey(HIGH, LOW)).toBe(`direct:${LOW}:${HIGH}`);
    expect(directCanonicalKey(LOW, HIGH)).toBe(`direct:${LOW}:${HIGH}`);
  });

  it('computes Product, Work Space, Deal, Project General, and Meta keys server-side', () => {
    expect(productCanonicalKey('p1')).toBe('product:p1');
    expect(workspaceCanonicalKey('w1')).toBe('workspace:w1');
    expect(dealCanonicalKey('d1')).toBe('deal:d1');
    expect(projectGeneralCanonicalKey('g1')).toBe('project_general:g1');
    expect(taskCanonicalKey('t1')).toBe('task:t1');
    expect(legacyMetaCanonicalKey('meta-1')).toBe('legacy:meta:meta-1');
    expect(whatsAppCanonicalKey('acc_1', '37499@c.us')).toBe('wa:acc_1:37499@c.us');
  });

  it('uses a stable legacy channel identity key', () => {
    expect(legacyChannelCanonicalKey('ch-1')).toBe('legacy:channel:ch-1');
  });
});

describe('messenger-legacy-identity', () => {
  it('uses unique source kind + id pairs for Channel/DM mapping', () => {
    expect(channelLegacyIdentity('c1')).toEqual({ sourceKind: 'CHANNEL', sourceId: 'c1' });
    expect(channelMessageLegacyIdentity('m1')).toEqual({
      sourceKind: 'CHANNEL_MESSAGE',
      sourceId: 'm1',
    });
    expect(directThreadLegacyIdentity('t1')).toEqual({
      sourceKind: 'DIRECT_THREAD',
      sourceId: 't1',
    });
    expect(directMessageLegacyIdentity('dm1')).toEqual({
      sourceKind: 'DIRECT_MESSAGE',
      sourceId: 'dm1',
    });
    expect(taskLegacyIdentity('t1')).toEqual({ sourceKind: 'TASK', sourceId: 't1' });
    expect(taskDiscussionEntryLegacyIdentity('e1')).toEqual({
      sourceKind: 'TASK_DISCUSSION_ENTRY',
      sourceId: 'e1',
    });
    expect(metaConversationLegacyIdentity('meta-1')).toEqual({
      sourceKind: 'META_CONVERSATION',
      sourceId: 'meta-1',
    });
    expect(metaMessageLegacyIdentity('INSTAGRAM:acc:mid')).toEqual({
      sourceKind: 'META_MESSAGE',
      sourceId: 'INSTAGRAM:acc:mid',
    });
  });
});
