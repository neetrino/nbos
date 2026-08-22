import { describe, expect, it } from 'vitest';
import { toAgentResponseBody } from './agent-response.envelope';

describe('agent response envelope', () => {
  it('lifts a paged handler result into data + meta', () => {
    const body = toAgentResponseBody({
      items: [{ id: 'task-1' }],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });

    expect(body).toEqual({
      data: [{ id: 'task-1' }],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
  });

  it('keeps an empty page as an empty collection, not a null record', () => {
    const body = toAgentResponseBody({ items: [], meta: { page: 1, pageSize: 20, total: 0 } });

    expect(body.data).toEqual([]);
    expect(body.meta).toEqual({ page: 1, pageSize: 20, total: 0 });
  });

  it('wraps a single record without inventing pagination', () => {
    const body = toAgentResponseBody({ id: 'ws-1', name: 'Platform' });

    expect(body).toEqual({ data: { id: 'ws-1', name: 'Platform' } });
    expect(body.meta).toBeUndefined();
  });

  it('wraps a bounded array that carries no meta', () => {
    const body = toAgentResponseBody([{ id: 'file-1' }]);

    expect(body).toEqual({ data: [{ id: 'file-1' }] });
  });

  it('does not treat a record that merely has an items field as a page', () => {
    const body = toAgentResponseBody({ items: ['a'], meta: { cursor: 'x' } });

    expect(body).toEqual({ data: { items: ['a'], meta: { cursor: 'x' } } });
  });

  it('never adds or removes projection fields', () => {
    const projection = { id: 'task-1', title: 'T', updatedAt: '2026-01-01T00:00:00.000Z' };

    expect(toAgentResponseBody(projection).data).toBe(projection);
  });

  it('normalizes an absent result to null data', () => {
    expect(toAgentResponseBody(undefined)).toEqual({ data: null });
  });
});
