import { describe, expect, it } from 'vitest';
import { countSkippedByReason } from './overdue-reminder-skip-labels';

describe('countSkippedByReason', () => {
  it('groups skip reasons', () => {
    expect(
      countSkippedByReason([
        { reason: 'tax_gate' },
        { reason: 'no_whatsapp' },
        { reason: 'tax_gate' },
      ]),
    ).toEqual([
      { reason: 'tax_gate', count: 2 },
      { reason: 'no_whatsapp', count: 1 },
    ]);
  });
});
