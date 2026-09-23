import { describe, expect, it } from 'vitest';
import { parseDeliveryNormsLocation } from './delivery-norms-tab-storage';
import { resolveDeliveryNormsSection, sectionFromLegacyLocation } from './delivery-norms-workspace';

describe('parseDeliveryNormsLocation', () => {
  it('keeps a stored Core and Function section', () => {
    expect(parseDeliveryNormsLocation(JSON.stringify({ section: 'functions' }))).toEqual({
      section: 'functions',
    });
  });

  it('maps leftover Rates / Function units / Sale onto the new sections', () => {
    expect(parseDeliveryNormsLocation(JSON.stringify({ tab: 'rates' }))).toEqual({
      section: 'rates',
    });
    expect(
      parseDeliveryNormsLocation(JSON.stringify({ tab: 'units', unitTab: 'function' })),
    ).toEqual({ section: 'functions' });
    expect(parseDeliveryNormsLocation(JSON.stringify({ tab: 'sale' }))).toEqual({
      section: 'functions',
    });
  });

  it('maps leftover overview, profiles, and core units onto Core', () => {
    expect(parseDeliveryNormsLocation('{"tab":"overview"}')).toEqual({ section: 'core' });
    expect(parseDeliveryNormsLocation('{"tab":"profiles","profileTab":"collections"}')).toEqual({
      section: 'core',
    });
    expect(parseDeliveryNormsLocation('{"tab":"units","unitTab":"core"}')).toEqual({
      section: 'core',
    });
    expect(parseDeliveryNormsLocation('not-json')).toEqual({ section: 'core' });
  });
});

describe('resolveDeliveryNormsSection', () => {
  it('prefers the query string over leftover storage', () => {
    expect(
      resolveDeliveryNormsSection({
        query: 'functions',
        stored: { tab: 'rates' },
        canSeeRules: true,
      }),
    ).toBe('functions');
  });

  it('maps leftover sale and units query values onto the new page', () => {
    expect(
      resolveDeliveryNormsSection({
        query: 'sale',
        stored: { section: 'core' },
        canSeeRules: true,
      }),
    ).toBe('functions');
    expect(
      resolveDeliveryNormsSection({
        query: 'units',
        stored: { section: 'functions' },
        canSeeRules: true,
      }),
    ).toBe('core');
  });

  it('keeps a catalog-only visitor on Functions', () => {
    expect(
      resolveDeliveryNormsSection({
        query: 'rates',
        stored: { section: 'core' },
        canSeeRules: false,
      }),
    ).toBe('functions');
  });
});

describe('sectionFromLegacyLocation', () => {
  it('sends sale and function units to Functions', () => {
    expect(sectionFromLegacyLocation({ tab: 'sale' })).toBe('functions');
    expect(sectionFromLegacyLocation({ tab: 'units', unitTab: 'function' })).toBe('functions');
  });
});
