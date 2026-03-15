import { Injectable, CanActivate, type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSION_KEY,
  type RequiredPermission,
} from '../decorators/require-permission.decorator';
import type { CurrentUserPayload } from '../decorators';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requirement = this.reflector.getAllAndOverride<RequiredPermission | undefined>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requirement) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: CurrentUserPayload;
      permissionScope?: string;
    }>();
    const user = request.user;

    if (!user?.permissions) {
      throw new ForbiddenException('No permissions loaded');
    }

    const key = `${requirement.module}_${requirement.action}`;
    const scope = user.permissions[key];

    if (!scope || scope === 'NONE') {
      throw new ForbiddenException(`No permission: ${requirement.module}.${requirement.action}`);
    }

    request.permissionScope = scope;
    return true;
  }
}
