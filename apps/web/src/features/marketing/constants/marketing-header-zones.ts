export type MarketingSectionId = 'board' | 'attribution' | 'dashboard' | 'settings';

export type MarketingHeaderZoneDefinition = {
  zone: MarketingSectionId;
  label: string;
};

/** Header zones for Marketing (Finance/Reports-style top nav). */
export const MARKETING_HEADER_ZONES: MarketingHeaderZoneDefinition[] = [
  { zone: 'board', label: 'Board' },
  { zone: 'attribution', label: 'Attribution' },
  { zone: 'dashboard', label: 'Dashboard' },
  { zone: 'settings', label: 'Settings' },
];
