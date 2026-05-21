import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { readInvoicesBoardViewMode, writeInvoicesBoardViewMode } from './invoices-board-view';

describe('invoices-board-view', () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defaults to kanban and persists list', () => {
    expect(readInvoicesBoardViewMode()).toBe('kanban');
    writeInvoicesBoardViewMode('list');
    expect(readInvoicesBoardViewMode()).toBe('list');
  });
});
