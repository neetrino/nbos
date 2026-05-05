import { describe, it, expect } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import {
  validateCommissionPolicyBody,
  PARTNER_COMMISSION_DEAL_TYPES,
  type CommissionPolicyRowInput,
} from './partner-commission-policy.ops';

function validRows(): CommissionPolicyRowInput[] {
  return PARTNER_COMMISSION_DEAL_TYPES.map((dealType) => ({
    dealType,
    percent: null,
  }));
}

describe('partner-commission-policy.ops', () => {
  it('validateCommissionPolicyBody accepts four null percents', () => {
    expect(() => validateCommissionPolicyBody(validRows())).not.toThrow();
  });

  it('rejects wrong length', () => {
    expect(() => validateCommissionPolicyBody([{ dealType: 'PRODUCT', percent: 10 }])).toThrow(
      BadRequestException,
    );
  });

  it('rejects invalid deal type', () => {
    const rows = validRows();
    rows[0] = { dealType: 'INVALID', percent: null };
    expect(() => validateCommissionPolicyBody(rows)).toThrow(BadRequestException);
  });

  it('rejects percent out of range', () => {
    const rows = validRows();
    rows[0] = { dealType: 'PRODUCT', percent: 101 };
    expect(() => validateCommissionPolicyBody(rows)).toThrow(BadRequestException);
  });
});
