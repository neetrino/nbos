import { buildSeedRoleUnits } from '../delivery-catalog/build-seed-role-units';
import type { ProfileSeedUnits } from './data/profile-seed-types';

/** An unpriced new core has no role vector, so it cannot be published by accident. */
export function profileSeedRoleUnits(units: ProfileSeedUnits) {
  return Object.keys(units).length === 0 ? [] : buildSeedRoleUnits(units);
}
