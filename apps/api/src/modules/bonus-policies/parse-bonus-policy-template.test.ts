import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';

import { parseBonusPolicyTemplateCode } from './parse-bonus-policy-template';

describe('parseBonusPolicyTemplateCode', () => {
  it('accepts known template codes', () => {
    expect(parseBonusPolicyTemplateCode('MANUAL_ONLY')).toBe('MANUAL_ONLY');
    expect(parseBonusPolicyTemplateCode('  SALES_COMPANY_RATES  ')).toBe('SALES_COMPANY_RATES');
  });

  it('rejects unknown codes', () => {
    expect(() => parseBonusPolicyTemplateCode('CUSTOM_RULES')).toThrow(BadRequestException);
  });
});
