import { describe, expect, it } from 'vitest';
import {
  forwardActionMetadata,
  readForwardedContent,
  readForwardedFrom,
  readForwardSourceMessageId,
} from './messenger-core-forward-meta';

describe('forward metadata', () => {
  it('reads the original author and source id', () => {
    const metadata = forwardActionMetadata(['src-1'], 'Ada Lovelace', 'hello');
    expect(readForwardedFrom(metadata)).toBe('Ada Lovelace');
    expect(readForwardedContent(metadata)).toBe('hello');
    expect(readForwardSourceMessageId(metadata)).toBe('src-1');
  });

  it('ignores unrelated metadata', () => {
    expect(readForwardedFrom({ messageAction: { kind: 'REPLY' } })).toBeNull();
    expect(readForwardSourceMessageId(null)).toBeNull();
  });
});
