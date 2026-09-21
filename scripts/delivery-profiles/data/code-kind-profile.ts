import type { ProductTypeKey } from '@nbos/shared';
import type { ProfileSeedKind, ProfileSeedUnits } from './profile-seed-types';

export function codeKindProfile(input: {
  keyStem: string;
  productType: ProductTypeKey;
  description: string;
  coreItems: ProfileSeedKind['coreItems'];
  units: ProfileSeedUnits;
  presets: ProfileSeedKind['presets'];
  includedFunctionCodes?: readonly string[];
}): ProfileSeedKind {
  return {
    keyStem: input.keyStem,
    productType: input.productType,
    productCategory: 'CODE',
    description: input.description,
    coreItems: input.coreItems,
    units: input.units,
    includedFunctionCodes: input.includedFunctionCodes ?? [],
    presets: input.presets,
  };
}

export function growPresets(
  base: readonly string[],
  extra: readonly string[],
  full: readonly string[],
): ProfileSeedKind['presets'] {
  const BASE = [...base];
  const EXTENDED = [...base, ...extra];
  const FULL = [...EXTENDED, ...full];
  return { BASE, EXTENDED, FULL };
}

export const SITE_LAUNCH = [
  'SRV_DOMAIN_HOSTING_SETUP',
  'SRV_ACCEPTANCE_SUPPORT',
  'INT_WEB_ANALYTICS',
] as const;

export const SYSTEM_LAUNCH = [
  'SRV_DOMAIN_HOSTING_SETUP',
  'SRV_ACCEPTANCE_SUPPORT',
  'MSG_EMAIL_NOTIFICATIONS',
  'ACC_TWO_FACTOR',
] as const;
