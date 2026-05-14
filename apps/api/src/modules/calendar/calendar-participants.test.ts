import { describe, it, expect } from 'vitest';
import { normalizeInternalParticipantIds } from './calendar-participants';

describe('normalizeInternalParticipantIds', () => {
  it('includes actor and dedupes', () => {
    expect(normalizeInternalParticipantIds(['a', 'a', 'b'], 'u')).toEqual(['u', 'a', 'b']);
  });

  it('filters empty strings', () => {
    expect(normalizeInternalParticipantIds(['', '  x  '], 'u')).toEqual(['u', '  x  ']);
  });
});
