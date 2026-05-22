import { describe, expect, it } from 'vitest';
import { isFinanceHeaderContextPath } from '@/lib/navigation/module-last-visit';

describe('isFinanceHeaderContextPath', () => {
  it('matches finance and bonus routes', () => {
    expect(isFinanceHeaderContextPath('/finance/invoices')).toBe(true);
    expect(isFinanceHeaderContextPath('/bonus')).toBe(true);
    expect(isFinanceHeaderContextPath('/finance/bonuses')).toBe(true);
  });

  it('does not match unrelated modules', () => {
    expect(isFinanceHeaderContextPath('/crm/leads')).toBe(false);
    expect(isFinanceHeaderContextPath('/dashboard')).toBe(false);
  });
});
