import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const NBOS_TENANT_ORGANIZATION_ID_ENV = 'NBOS_TENANT_ORGANIZATION_ID';

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
