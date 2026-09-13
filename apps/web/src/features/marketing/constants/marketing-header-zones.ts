export type MarketingSectionId = 'board' | 'attribution' | 'dashboard' | 'settings';

export type MarketingHeaderZoneDefinition = {
  zone: MarketingSectionId;
};

/** Header zones for Marketing (Finance/Reports-style top nav). Labels resolve via `marketing.nav.*`. */
export const MARKETING_HEADER_ZONES: MarketingHeaderZoneDefinition[] = [
  { zone: 'board' },
  { zone: 'attribution' },
  { zone: 'dashboard' },
  { zone: 'settings' },
];
