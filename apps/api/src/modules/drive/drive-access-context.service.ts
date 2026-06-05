import { Injectable } from '@nestjs/common';
import type { CurrentUserPayload } from '../../common/decorators';
import { buildDocumentsReadAccess } from '../documents/documents-read-access.dto';
import { PlatformAccessResolverService } from '../platform-access/platform-access-resolver.service';
import type { DriveEntityAccess, DriveEntityContextAccess } from './drive-access.types';
import { isGlobalDriveOwnerRole, mergeDriveEffectiveScope } from './drive-effective-scope';

@Injectable()
export class DriveAccessContextService {
  constructor(private readonly platformAccess: PlatformAccessResolverService) {}

  async fromRequest(
    user: CurrentUserPayload,
    rbacScope: string | undefined,
  ): Promise<DriveEntityAccess> {
    const policyMode = await this.platformAccess.resolveScopeModeForFamily(user.id, 'DRIVE');
    return {
      employeeId: user.id,
      departmentIds: user.departmentIds ?? [],
      driveScope: mergeDriveEffectiveScope(rbacScope, policyMode, {
        globalOwnerRole: isGlobalDriveOwnerRole(user.role),
      }),
    };
  }

  async fromRequestWithDocuments(
    user: CurrentUserPayload,
    rbacScope: string | undefined,
  ): Promise<DriveEntityContextAccess> {
    return {
      ...(await this.fromRequest(user, rbacScope)),
      documentsAccess: buildDocumentsReadAccess(user),
    };
  }
}
