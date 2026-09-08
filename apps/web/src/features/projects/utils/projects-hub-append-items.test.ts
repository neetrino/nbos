import { describe, expect, it } from 'vitest';
import { appendUniqueProjects, uniqueProjectsById } from './projects-hub-append-items';

describe('uniqueProjectsById', () => {
  it('keeps the first occurrence of a repeated id', () => {
    expect(
      uniqueProjectsById([
        { id: '3ccc2f8b-d42f-48f0-9abd-98d1bbf26874', name: 'a' },
        { id: 'other', name: 'b' },
        { id: '3ccc2f8b-d42f-48f0-9abd-98d1bbf26874', name: 'a-dup' },
      ]),
    ).toEqual([
      { id: '3ccc2f8b-d42f-48f0-9abd-98d1bbf26874', name: 'a' },
      { id: 'other', name: 'b' },
    ]);
  });
});

describe('appendUniqueProjects', () => {
  it('skips ids already on the loaded pages', () => {
    expect(
      appendUniqueProjects([{ id: 'p1' }, { id: 'p2' }], [{ id: 'p2' }, { id: 'p3' }]),
    ).toEqual([{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }]);
  });

  it('returns the current list when the next page is fully overlapping', () => {
    const current = [{ id: 'p1' }, { id: 'p2' }];
    expect(appendUniqueProjects(current, [{ id: 'p1' }, { id: 'p2' }])).toBe(current);
  });
});
