import { describe, it, expect } from 'vitest';
import { channelTypeFromApi, channelTypeToApi } from './messenger-channel-type.util';

describe('messenger channel type mapping', () => {
  it('round-trips API labels', () => {
    expect(channelTypeToApi(channelTypeFromApi('general'))).toBe('general');
    expect(channelTypeToApi(channelTypeFromApi('project'))).toBe('project');
    expect(channelTypeToApi(channelTypeFromApi('announcement'))).toBe('announcement');
  });
});
