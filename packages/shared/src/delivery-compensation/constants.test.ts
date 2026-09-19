import { describe, expect, it } from 'vitest';
import { LEAD_SOURCES } from '../constants';
import {
  DELIVERY_COMPENSATION_CURRENCY,
  DELIVERY_COMPENSATION_ENROLLMENT_DEFAULT,
  DELIVERY_COMPENSATION_ERROR_CODES,
  DELIVERY_COMPENSATION_ROLE_KEYS,
  DELIVERY_DESIGN_MODES,
  DELIVERY_FUNCTION_ICON_ALLOWLIST,
} from './constants';

describe('delivery compensation contracts', () => {
  it('keeps six delivery roles and does not invent a Seller delivery role', () => {
    expect(DELIVERY_COMPENSATION_ROLE_KEYS).toEqual([
      'BACKEND',
      'FRONTEND',
      'PM',
      'DESIGNER',
      'QA',
      'TECHNICAL_SPECIALIST',
    ]);
  });

  it('keeps three design modes and enrollment off by default', () => {
    expect(DELIVERY_DESIGN_MODES).toEqual(['AI_DESIGN', 'CONCEPT', 'FULL_DESIGN']);
    expect(DELIVERY_COMPENSATION_ENROLLMENT_DEFAULT).toBe(false);
    expect(DELIVERY_COMPENSATION_CURRENCY).toBe('AMD');
  });

  it('adds NETWORK as a fifth From without renaming Sales channel NETWORKING', () => {
    expect(LEAD_SOURCES).toEqual(['MARKETING', 'SALES', 'PARTNER', 'CLIENT', 'NETWORK']);
  });

  it('exposes structured error codes without financial payloads', () => {
    expect(DELIVERY_COMPENSATION_ERROR_CODES).toContain('NORMATIVE_NOT_CONFIGURED');
    expect(DELIVERY_COMPENSATION_ERROR_CODES).toContain('REDISTRIBUTION_REQUIRED');
    expect(DELIVERY_FUNCTION_ICON_ALLOWLIST).toContain('CreditCard');
  });
});
