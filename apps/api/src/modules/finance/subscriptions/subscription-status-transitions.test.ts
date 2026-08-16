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

  it('allows ACTIVE → COMPLETED', () => {
    expect(() => assertSubscriptionStatusTransition('ACTIVE', 'COMPLETED')).not.toThrow();
  });

  it('allows ON_HOLD → COMPLETED', () => {
    expect(() => assertSubscriptionStatusTransition('ON_HOLD', 'COMPLETED')).not.toThrow();
  });

  it('rejects same status', () => {
    expect(() => assertSubscriptionStatusTransition('ACTIVE', 'ACTIVE')).toThrow(
      BadRequestException,
    );
  });

  it('allows CANCELLED → ACTIVE', () => {
    expect(() => assertSubscriptionStatusTransition('CANCELLED', 'ACTIVE')).not.toThrow();
  });

  it('rejects CANCELLED → ON_HOLD', () => {
    expect(() => assertSubscriptionStatusTransition('CANCELLED', 'ON_HOLD')).toThrow(
      BadRequestException,
    );
  });

  it('rejects COMPLETED → ACTIVE', () => {
    expect(() => assertSubscriptionStatusTransition('COMPLETED', 'ACTIVE')).toThrow(
      BadRequestException,
    );
  });

  it('rejects PENDING → COMPLETED', () => {
    expect(() => assertSubscriptionStatusTransition('PENDING', 'COMPLETED')).toThrow(
      BadRequestException,
    );
  });
});
