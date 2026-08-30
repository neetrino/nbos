import { describe, expect, it } from 'vitest';
import { directCanonicalKey, legacyChannelCanonicalKey } from './messenger-core-canonical-key';
import {
  channelLegacyIdentity,
  channelMessageLegacyIdentity,
  directMessageLegacyIdentity,
  directThreadLegacyIdentity,
} from './messenger-legacy-identity';

const LOW = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const HIGH = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

describe('messenger-core-canonical-key', () => {
  it('orders DIRECT pairs lexicographically', () => {
    expect(directCanonicalKey(HIGH, LOW)).toBe(`direct:${LOW}:${HIGH}`);
    expect(directCanonicalKey(LOW, HIGH)).toBe(`direct:${LOW}:${HIGH}`);
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
  });
});
