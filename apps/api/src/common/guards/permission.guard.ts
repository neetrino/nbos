import { Injectable, CanActivate, type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSION_KEY,
  type RequiredPermission,
} from '../decorators/require-permission.decorator';
import type { CurrentUserPayload } from '../decorators';
import { routePermissionDepartmentIds } from '../authorization/permission-department-scope';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requirement = this.reflector.getAllAndOverride<
      RequiredPermission | RequiredPermission[] | undefined
    >(PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    if (!requirement) {
      return true;
    }

    const candidates = Array.isArray(requirement) ? requirement : [requirement];

    const request = context.switchToHttp().getRequest<{
      user?: CurrentUserPayload;
      permissionScope?: string;
    }>();
    const user = request.user;

    if (!user?.permissions) {
      throw new ForbiddenException('No permissions loaded');
    }

    for (const candidate of candidates) {
      const permissionKey = `${candidate.module}_${candidate.action}`;
      const scope = user.permissions[permissionKey];

      if (scope && scope !== 'NONE') {
        request.permissionScope = scope;
        user.requestPermissionDepartmentIds = routePermissionDepartmentIds(user, permissionKey);
        return true;
      }
    }

    const missing = candidates
      .map((candidate) => `${candidate.module}.${candidate.action}`)
      .join(' or ');
    throw new ForbiddenException(`No permission: ${missing}`);
  }
}
