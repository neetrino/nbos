import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { assertCanDeleteInvoice } from './invoice-delete-access';

describe('assertCanDeleteInvoice', () => {
  it('allows the platform owner', () => {
    expect(() => assertCanDeleteInvoice({ isPlatformOwner: true })).not.toThrow();
  });

  it('forbids everyone else', () => {
    expect(() => assertCanDeleteInvoice({ isPlatformOwner: false })).toThrow(ForbiddenException);
    expect(() => assertCanDeleteInvoice({})).toThrow(ForbiddenException);
  });
});
