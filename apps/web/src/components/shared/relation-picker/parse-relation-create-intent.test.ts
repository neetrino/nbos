import { describe, expect, it } from 'vitest';
import {
  buildRelationCreateIntent,
  parseRelationCreateIntent,
} from './parse-relation-create-intent';

describe('parseRelationCreateIntent', () => {
  it('returns empty for undefined', () => {
    expect(parseRelationCreateIntent(undefined)).toEqual({});
  });

  it('returns field intent only when no project suffix', () => {
    expect(parseRelationCreateIntent('deal-contact')).toEqual({
      fieldIntent: 'deal-contact',
    });
  });

  it('splits field intent and project id', () => {
    expect(parseRelationCreateIntent('deal-existing-product@proj-1')).toEqual({
      fieldIntent: 'deal-existing-product',
      projectId: 'proj-1',
    });
  });
});

describe('buildRelationCreateIntent', () => {
  it('returns undefined for blank field intent', () => {
    expect(buildRelationCreateIntent('', 'p1')).toBeUndefined();
  });

  it('appends project id when provided', () => {
    expect(buildRelationCreateIntent('deal-existing-product', 'p1')).toBe(
      'deal-existing-product@p1',
    );
  });
});
