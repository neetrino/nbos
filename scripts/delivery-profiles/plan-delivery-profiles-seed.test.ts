import { describe, expect, it } from 'vitest';
import {
  buildProfileSeedVersions,
  PROFILE_SEED_KINDS,
  profileKeyFor,
  referencedFunctionCodes,
} from './delivery-profiles-seed-data';
import { formatProfileSeedPlan, planDeliveryProfilesSeed } from './plan-delivery-profiles-seed';

const ALL_CODES = referencedFunctionCodes();

function draft(profileKey: string) {
  return { profileKey, status: 'DRAFT', configurationCount: 0 };
}

describe('delivery profile seed data', () => {
  it('produces one profile key per kind and size, and keys never collide', () => {
    const versions = buildProfileSeedVersions();
    const keys = versions.map((version) => version.profileKey);

    expect(versions).toHaveLength(PROFILE_SEED_KINDS.length * 5);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('keeps the core composition identical across sizes and scales only its volume', () => {
    const versions = buildProfileSeedVersions([PROFILE_SEED_KINDS[0]]);
    const small = versions.find((version) => version.configSize === 'SMALL');
    const enterprise = versions.find((version) => version.configSize === 'ENTERPRISE');

    expect(small?.kind.coreItems).toEqual(enterprise?.kind.coreItems);
    expect(Number(enterprise?.units.BACKEND)).toBeGreaterThan(Number(small?.units.BACKEND));
  });

  it('never marks a preset module as included in the base', () => {
    for (const kind of PROFILE_SEED_KINDS) {
      const presetCodes = new Set(Object.values(kind.presets).flat());
      for (const included of kind.includedFunctionCodes) {
        expect(presetCodes.has(included)).toBe(false);
      }
    }
  });

  it('grows the preset with the size instead of replacing it', () => {
    for (const kind of PROFILE_SEED_KINDS) {
      expect(kind.presets.SMALL.length).toBeLessThan(kind.presets.CLASSIC.length);
      expect(kind.presets.CLASSIC.length).toBeLessThan(kind.presets.LARGE.length);
      expect(kind.presets.LARGE.length).toBeLessThan(kind.presets.VERY_LARGE.length);
      expect(kind.presets.VERY_LARGE.length).toBeLessThan(kind.presets.ENTERPRISE.length);
      for (const code of kind.presets.SMALL) {
        expect(kind.presets.ENTERPRISE).toContain(code);
      }
    }
  });

  it('lists no module twice inside one preset', () => {
    for (const kind of PROFILE_SEED_KINDS) {
      for (const codes of Object.values(kind.presets)) {
        expect(new Set(codes).size).toBe(codes.length);
      }
    }
  });

  it('keeps browser-only cards out of a mobile app preset', () => {
    const browserOnlyCodes = ['INT_WEB_ANALYTICS', 'INT_ADS_PIXELS', 'INT_LIVE_CHAT'];
    const mobile = PROFILE_SEED_KINDS.filter((kind) => kind.productType === 'MOBILE_APP');

    expect(mobile.length).toBeGreaterThan(0);
    for (const kind of mobile) {
      const presetCodes = new Set(Object.values(kind.presets).flat());
      for (const code of browserOnlyCodes) {
        expect(presetCodes.has(code)).toBe(false);
      }
    }
  });

  it('builds a readable key from the kind and the size', () => {
    expect(profileKeyFor(PROFILE_SEED_KINDS[0], 'VERY_LARGE')).toBe('shop-code-very-large');
  });
});

describe('planDeliveryProfilesSeed', () => {
  it('creates everything on an empty database', () => {
    const plan = planDeliveryProfilesSeed([], ALL_CODES);

    expect(plan.keepCount).toBe(0);
    expect(plan.createCount).toBe(PROFILE_SEED_KINDS.length * 5);
    expect(plan.missingFunctionCodes).toEqual([]);
  });

  it('keeps a profile key the Owner may already have edited', () => {
    const plan = planDeliveryProfilesSeed([draft('shop-code-classic')], ALL_CODES);

    expect(plan.keepCount).toBe(1);
    expect(plan.replaceCount).toBe(0);
    expect(plan.entries.find((entry) => entry.action === 'KEEP')?.version.profileKey).toBe(
      'shop-code-classic',
    );
  });

  it('replaces an untouched draft only when asked to', () => {
    const existing = [draft('shop-code-classic')];

    expect(planDeliveryProfilesSeed(existing, ALL_CODES).replaceCount).toBe(0);
    expect(
      planDeliveryProfilesSeed(existing, ALL_CODES, { replaceDrafts: true }).replaceCount,
    ).toBe(1);
  });

  it('never replaces a published norm or one a configuration froze', () => {
    const plan = planDeliveryProfilesSeed(
      [
        { profileKey: 'shop-code-small', status: 'PUBLISHED', configurationCount: 0 },
        { profileKey: 'shop-code-classic', status: 'DRAFT', configurationCount: 3 },
      ],
      ALL_CODES,
      { replaceDrafts: true },
    );

    expect(plan.replaceCount).toBe(0);
    expect(plan.keepCount).toBe(2);
    const reasons = plan.entries
      .filter((entry) => entry.action === 'KEEP')
      .map((entry) => (entry.action === 'KEEP' ? entry.reason : ''));
    expect(reasons).toEqual(['not a draft', 'a configuration froze it']);
  });

  it('names the catalog codes it cannot resolve instead of writing orphans', () => {
    const plan = planDeliveryProfilesSeed([], ['PAY_AMERIABANK']);

    expect(plan.missingFunctionCodes.length).toBeGreaterThan(0);
    expect(plan.missingFunctionCodes).not.toContain('PAY_AMERIABANK');
    expect(formatProfileSeedPlan(plan, false)).toContain('Missing catalog codes');
  });
});
