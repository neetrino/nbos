import { describe, expect, it } from 'vitest';
import { claimInFlightSubmit } from './use-create-subscription-invoice-dialog';

describe('claimInFlightSubmit', () => {
  it('claims once and ignores an overlapping submit', () => {
    const flag = { current: false };
    expect(claimInFlightSubmit(flag)).toBe(true);
    expect(claimInFlightSubmit(flag)).toBe(false);
    expect(flag.current).toBe(true);
  });

  it('allows a new submit after the in-flight flag is released', () => {
    const flag = { current: true };
    expect(claimInFlightSubmit(flag)).toBe(false);
    flag.current = false;
    expect(claimInFlightSubmit(flag)).toBe(true);
  });
});
