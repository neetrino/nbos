import { describe, expect, it } from 'vitest';
import { isSalesSeatRoleSlug, SELLER_ASSISTANT_ROLE_SLUG, SELLER_ROLE_SLUG } from './sales-roles';

describe('isSalesSeatRoleSlug', () => {
  it('accepts Seller and Seller Assistant', () => {
    expect(isSalesSeatRoleSlug(SELLER_ROLE_SLUG)).toBe(true);
    expect(isSalesSeatRoleSlug(SELLER_ASSISTANT_ROLE_SLUG)).toBe(true);
    expect(isSalesSeatRoleSlug('Seller')).toBe(true);
  });

  it('rejects other roles', () => {
    expect(isSalesSeatRoleSlug('head-sales')).toBe(false);
    expect(isSalesSeatRoleSlug('pm')).toBe(false);
    expect(isSalesSeatRoleSlug(undefined)).toBe(false);
  });
});
