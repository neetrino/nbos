import { describe, expect, it } from 'vitest';
import type { DeliveryRoleRateFinancialDto } from '@nbos/shared';
import { currentRoleRate, currentRatesByRole } from './current-published-role-rate';

function rate(
  patch: Pick<DeliveryRoleRateFinancialDto, 'roleKey' | 'rate' | 'version' | 'status'>,
): DeliveryRoleRateFinancialDto {
  return { id: `${patch.roleKey}-${patch.version}-${patch.status}`, currency: 'AMD', ...patch };
}

describe('currentRoleRate', () => {
  it('prefers published over a newer draft', () => {
    const rows = [
      rate({ roleKey: 'BACKEND', rate: '800', version: 1, status: 'PUBLISHED' }),
      rate({ roleKey: 'BACKEND', rate: '1200', version: 3, status: 'DRAFT' }),
      rate({ roleKey: 'BACKEND', rate: '1000', version: 2, status: 'PUBLISHED' }),
      rate({ roleKey: 'QA', rate: '500', version: 1, status: 'DRAFT' }),
    ];
    expect(currentRoleRate(rows, 'BACKEND')).toBe('1000');
    expect(currentRoleRate(rows, 'QA')).toBe('500');
    expect(currentRoleRate(rows, 'PM')).toBeNull();
  });

  it('ignores archived rows', () => {
    expect(
      currentRoleRate([rate({ roleKey: 'PM', rate: '700', version: 4, status: 'ARCHIVED' })], 'PM'),
    ).toBeNull();
  });
});

describe('currentRatesByRole', () => {
  it('covers every compensation role', () => {
    const map = currentRatesByRole([
      rate({ roleKey: 'FRONTEND', rate: '900', version: 1, status: 'PUBLISHED' }),
    ]);
    expect(map.FRONTEND).toBe('900');
    expect(map.BACKEND).toBeNull();
    expect(map.TECHNICAL_SPECIALIST).toBeNull();
  });
});
