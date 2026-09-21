import { describe, expect, it } from 'vitest';
import {
  buildProfileSeedVersions,
  PROFILE_SEED_KINDS,
  profileKeyFor,
  referencedFunctionCodes,
} from './delivery-profiles-seed-data';
import { collectionsForKind } from './data/profile-seed-types';
import { formatProfileSeedPlan, planDeliveryProfilesSeed } from './plan-delivery-profiles-seed';

const ALL_CODES = referencedFunctionCodes();

function draft(profileKey: string) {
  return { profileKey, status: 'DRAFT', configurationCount: 0 };
}

describe('delivery profile seed data', () => {
  it('produces one profile key per kind', () => {
    const versions = buildProfileSeedVersions();
    const keys = versions.map((version) => version.profileKey);

    expect(versions).toHaveLength(PROFILE_SEED_KINDS.length);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('never marks a collection module as included in the base', () => {
    for (const kind of PROFILE_SEED_KINDS) {
      const codes = new Set(collectionsForKind(kind).flatMap((row) => row.functionCodes));
      for (const included of kind.includedFunctionCodes) {
        expect(codes.has(included)).toBe(false);
      }
    }
  });

  it('grows named collections instead of replacing them', () => {
    for (const kind of PROFILE_SEED_KINDS) {
      expect(kind.presets.BASE.length).toBeLessThan(kind.presets.EXTENDED.length);
      expect(kind.presets.EXTENDED.length).toBeLessThan(kind.presets.FULL.length);
    }
  });

  it('builds a key from the kind stem only', () => {
    expect(profileKeyFor(PROFILE_SEED_KINDS[0])).toBe('shop-code');
  });

  it('seeds the remaining enum kinds as one unsized core each', () => {
    const types = PROFILE_SEED_KINDS.map((kind) => kind.productType);
    expect(types).toEqual(
      expect.arrayContaining(['BUSINESS_CARD_WEBSITE', 'WEB_APP', 'ERP', 'SAAS']),
    );
    expect(types).not.toContain('OTHER');
    expect(types).not.toContain('MOBILE_APP');
    expect(buildProfileSeedVersions().map((row) => row.profileKey)).toEqual(
      expect.arrayContaining(['business-card-code', 'web-app-code', 'erp-code', 'saas-code']),
    );
    expect(buildProfileSeedVersions().map((row) => row.profileKey)).not.toContain(
      'mobile-app-code',
    );
  });
});

describe('planDeliveryProfilesSeed', () => {
  it('creates one core per kind on an empty database', () => {
    const plan = planDeliveryProfilesSeed([], ALL_CODES);

    expect(plan.keepCount).toBe(0);
    expect(plan.createCount).toBe(PROFILE_SEED_KINDS.length);
    expect(plan.missingFunctionCodes).toEqual([]);
  });

  it('keeps a profile key the Owner may already have edited', () => {
    const plan = planDeliveryProfilesSeed([draft('shop-code')], ALL_CODES);

    expect(plan.keepCount).toBe(1);
    expect(plan.replaceCount).toBe(0);
  });

  it('replaces an untouched draft only when asked to', () => {
    const existing = [draft('shop-code')];

    expect(planDeliveryProfilesSeed(existing, ALL_CODES).replaceCount).toBe(0);
    expect(
      planDeliveryProfilesSeed(existing, ALL_CODES, { replaceDrafts: true }).replaceCount,
    ).toBe(1);
  });

  it('retires unused sized draft keys and the leftover mobile-app core', () => {
    const plan = planDeliveryProfilesSeed(
      [draft('shop-code-classic'), draft('shop-code'), draft('mobile-app-code')],
      ALL_CODES,
      { replaceDrafts: true },
    );

    expect(plan.retireCount).toBe(2);
    expect(formatProfileSeedPlan(plan, false)).toContain('shop-code-classic');
    expect(formatProfileSeedPlan(plan, false)).toContain('mobile-app-code');
  });
});
