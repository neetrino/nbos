import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const NBOS_TENANT_ORGANIZATION_ID_ENV = 'NBOS_TENANT_ORGANIZATION_ID';
export const NBOS_DRIVE_ALLOW_STORAGE_RESET_ENV = 'NBOS_DRIVE_ALLOW_STORAGE_RESET';

/** Stable tenant id used in R2 keys (`nbos/tenants/{organizationId}/...`). */
export function readTenantOrganizationId(config: ConfigService): string {
  const value = config.get<string>(NBOS_TENANT_ORGANIZATION_ID_ENV)?.trim();
  if (!value) {
    throw new BadRequestException(
      `${NBOS_TENANT_ORGANIZATION_ID_ENV} must be set for Drive storage home paths.`,
    );
  }
  return value;
}

/** Guards destructive Drive + R2 wipe (enabled by default in non-production). */
export function isDriveStorageResetEnabled(config: ConfigService): boolean {
  const flag = config.get<string>(NBOS_DRIVE_ALLOW_STORAGE_RESET_ENV)?.trim().toLowerCase();
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return config.get<string>('NODE_ENV') !== 'production';
}
