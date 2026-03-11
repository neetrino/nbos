import { SetMetadata } from '@nestjs/common';
import type { EmployeeRoleEnum } from '@nbos/database';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: EmployeeRoleEnum[]) => SetMetadata(ROLES_KEY, roles);
