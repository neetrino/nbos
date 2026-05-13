import { describe, it, expect } from 'vitest';
import { buildTaskListSearchWhere } from './task-list-search-where.op';

describe('buildTaskListSearchWhere', () => {
  it('includes title, code, description, and relation fields', () => {
    const w = buildTaskListSearchWhere('acme');
    expect(w.OR).toBeDefined();
    expect(Array.isArray(w.OR)).toBe(true);
    expect((w.OR as unknown[]).length).toBeGreaterThan(5);
    expect(w.OR).toEqual(
      expect.arrayContaining([
        { title: { contains: 'acme', mode: 'insensitive' } },
        { code: { contains: 'acme', mode: 'insensitive' } },
        { product: { name: { contains: 'acme', mode: 'insensitive' } } },
      ]),
    );
  });
});
