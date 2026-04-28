import { describe, it, expect } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { assertSubscriptionStatusTransition } from './subscription-status-transitions';

describe('assertSubscriptionStatusTransition', () => {
  it('allows PENDING → ACTIVE', () => {
    expect(() => assertSubscriptionStatusTransition('PENDING', 'ACTIVE')).not.toThrow();
  });

  it('allows ACTIVE → CANCELLED', () => {
    expect(() => assertSubscriptionStatusTransition('ACTIVE', 'CANCELLED')).not.toThrow();
  });

  it('rejects same status', () => {
    expect(() => assertSubscriptionStatusTransition('ACTIVE', 'ACTIVE')).toThrow(
      BadRequestException,
    );
  });

  it('rejects CANCELLED → ACTIVE', () => {
    expect(() => assertSubscriptionStatusTransition('CANCELLED', 'ACTIVE')).toThrow(
      BadRequestException,
    );
  });
});
