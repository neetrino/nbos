import { Injectable, CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { EmployeeRoleEnum } from '@nbos/database';
import { ROLES_KEY } from '../decorators';
import type { CurrentUserPayload } from '../decorators';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<EmployeeRoleEnum[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: CurrentUserPayload }>();
    const user = request.user;

    if (!user) {
      return false;
    }

    return requiredRoles.includes(user.role as EmployeeRoleEnum);
  }
}
