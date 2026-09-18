import { describe, expect, it } from 'vitest';
import { parseOptionalEntityNotes } from './parse-entity-notes';

describe('parseOptionalEntityNotes', () => {
  it('leaves undefined untouched', () => {
    expect(parseOptionalEntityNotes(undefined)).toBeUndefined();
  });

  it('trims text and clears blank values', () => {
    expect(parseOptionalEntityNotes('  Keep  ')).toBe('Keep');
    expect(parseOptionalEntityNotes('   ')).toBeNull();
    expect(parseOptionalEntityNotes(null)).toBeNull();
  });
});
