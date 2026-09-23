export const DELIVERY_NORMS_SECTIONS = ['core', 'functions', 'rates'] as const;

export type DeliveryNormsSection = (typeof DELIVERY_NORMS_SECTIONS)[number];

export const DELIVERY_NORMS_FUNCTION_SHEET_TABS = ['general', 'units', 'price'] as const;

export type DeliveryNormsFunctionSheetTab = (typeof DELIVERY_NORMS_FUNCTION_SHEET_TABS)[number];

export const DELIVERY_NORMS_CORE_SHEET_TABS = [
  'composition',
  'units',
  'included',
  'price',
  'collections',
] as const;

export type DeliveryNormsCoreSheetTab = (typeof DELIVERY_NORMS_CORE_SHEET_TABS)[number];

const SECTION_SET = new Set<string>(DELIVERY_NORMS_SECTIONS);

export function isDeliveryNormsSection(value: string): value is DeliveryNormsSection {
  return SECTION_SET.has(value);
}

export function sectionFromQuery(value: string | null | undefined): DeliveryNormsSection | null {
  if (!value) return null;
  if (isDeliveryNormsSection(value)) return value;
  if (value === 'sale') return 'functions';
  if (value === 'units' || value === 'model' || value === 'overview' || value === 'profiles') {
    return 'core';
  }
  return null;
}

/**
 * Maps the previous page tabs (and leftover storage) onto the three-section page.
 * rates → Role rates; function units / sale → Functions; everything else → Core.
 */
export function sectionFromLegacyLocation(record: Record<string, unknown>): DeliveryNormsSection {
  const tab = typeof record.tab === 'string' ? record.tab : '';
  const unitTab = typeof record.unitTab === 'string' ? record.unitTab : '';
  if (tab === 'rates') return 'rates';
  if (tab === 'sale' || tab === 'functions') return 'functions';
  if (tab === 'units' && unitTab === 'function') return 'functions';
  return 'core';
}

export function resolveDeliveryNormsSection(input: {
  query: string | null | undefined;
  stored: Record<string, unknown> | null;
  canSeeRules: boolean;
}): DeliveryNormsSection {
  const preferred =
    sectionFromQuery(input.query) ??
    (input.stored && typeof input.stored.section === 'string'
      ? sectionFromQuery(input.stored.section)
      : null) ??
    (input.stored ? sectionFromLegacyLocation(input.stored) : 'core');
  if (!input.canSeeRules) return 'functions';
  return preferred;
}
