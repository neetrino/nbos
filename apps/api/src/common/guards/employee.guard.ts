import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { IS_PUBLIC_KEY } from '../decorators';
import { PlatformOwnershipService } from '../../modules/platform-ownership/platform-ownership.service';
import { buildEmployeeAuthorizationContext } from '../authorization/employee-authorization-context';
import type { EffectivePermissionGrant } from '../authorization/effective-permissions';
import { activeAdditionalRoleAssignments } from '../authorization/active-role-assignments';

interface CachedEmployee {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roleLevel: number;
  roles: Array<{ id: string; name: string; slug: string; level: number }>;
  departmentIds: string[];
  permissions: Record<string, string>;
  permissionGrants: Record<string, EffectivePermissionGrant>;
  isPlatformOwner: boolean;
  accessVersion: number;
  assignmentIds: string;
  meProfile: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    telegram: string | null;
    avatar: string | null;
    position: string | null;
    birthday: string | null;
    hireDate: string | null;
    status: 'ACTIVE' | 'PROBATION' | 'ON_LEAVE' | 'TERMINATED';
    isPlatformOwner: boolean;
    role: {
      id: string;
      name: string;
      slug: string;
      level: number;
    };
    permissionRoles: Array<{ id: string; name: string; slug: string; level: number }>;
    departments: Array<{
      id: string;
      departmentId: string;
      deptRole: string;
      isPrimary: boolean;
      department: {
        id: string;
        name: string;
        slug: string;
      };
    }>;
  };
  cachedAt: number;
}

const CACHE_TTL_MS = 60_000;

const employeeGuardCache = new Map<string, CachedEmployee>();

/** Drops the in-process `/api/me` cache after profile fields such as avatar change. */
export function invalidateEmployeeGuardCache(employeeId: string): void {
  employeeGuardCache.delete(employeeId);
}

/**
 * Loads full Employee data (role, departments, permissions) into request.user
 * after AuthGuard has already verified the JWT and set employeeId.
 * Registered as APP_GUARD between AuthGuard and PermissionGuard.
 */
@Injectable()
export class EmployeeGuard implements CanActivate {
  private inflight = new Map<string, Promise<CachedEmployee>>();

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly reflector: Reflector,
    private readonly platformOwnership: PlatformOwnershipService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: Record<string, unknown>;
    }>();

    const employeeId = request.user?.employeeId as string | undefined;
    if (!employeeId) {
      return true;
    }

    const cached = employeeGuardCache.get(employeeId);
    if (cached && (await this.cacheIsCurrent(employeeId, cached))) {
      request.user = {
        ...request.user,
        ...(await this.withLiveOwnerFlag(employeeId, cached)),
      };
      return true;
    }

    const enriched = await this.loadEmployee(employeeId);
    request.user = { ...request.user, ...enriched };

    return true;
  }

  private async loadEmployee(employeeId: string): Promise<CachedEmployee> {
    const existing = this.inflight.get(employeeId);
    if (existing) return existing;

    const promise = this.fetchAndCache(employeeId);
    this.inflight.set(employeeId, promise);

    try {
      return await promise;
    } finally {
      this.inflight.delete(employeeId);
    }
  }

  private async fetchAndCache(employeeId: string): Promise<CachedEmployee> {
    const now = new Date();
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
        departments: {
          include: { department: { select: { id: true, name: true, slug: true } } },
          orderBy: [{ isPrimary: 'desc' }, { joinedAt: 'asc' }],
        },
        permissionRoleAssignments: {
          where: activeAdditionalRoleAssignments(now),
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!employee) {
      throw new UnauthorizedException('Employee not found');
    }

    if (employee.status === 'TERMINATED') {
      throw new UnauthorizedException('Account deactivated');
    }

    const departmentIds = employee.departments.map((item) => item.departmentId);
    const authorization = buildEmployeeAuthorizationContext({
      legacyRole: employee.role,
      assignments: employee.permissionRoleAssignments ?? [],
      departmentIds,
    });
    const isPlatformOwner = await this.platformOwnership.isPlatformOwner(employeeId);

    const enriched: CachedEmployee = {
      id: employee.id,
      email: employee.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
      role: employee.role.slug,
      roleLevel: employee.role.level,
      roles: authorization.roles,
      departmentIds,
      permissions: authorization.permissions,
      permissionGrants: authorization.grants,
      isPlatformOwner,
      accessVersion: employee.accessVersion,
      assignmentIds: (employee.permissionRoleAssignments ?? [])
        .map((item) => item.id)
        .sort()
        .join(','),
      meProfile: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone,
        telegram: employee.telegram,
        avatar: employee.avatar,
        position: employee.position,
        birthday: employee.birthday?.toISOString() ?? null,
        hireDate: employee.hireDate?.toISOString() ?? null,
        status: employee.status,
        isPlatformOwner,
        role: {
          id: employee.role.id,
          name: employee.role.name,
          slug: employee.role.slug,
          level: employee.role.level,
        },
        permissionRoles: authorization.roles,
        departments: employee.departments.map((departmentLink) => ({
          id: departmentLink.id,
          departmentId: departmentLink.departmentId,
          deptRole: departmentLink.deptRole,
          isPrimary: departmentLink.isPrimary,
          department: {
            id: departmentLink.department.id,
            name: departmentLink.department.name,
            slug: departmentLink.department.slug,
          },
        })),
      },
      cachedAt: Date.now(),
    };

    employeeGuardCache.set(employeeId, enriched);
    return enriched;
  }

  private async cacheIsCurrent(employeeId: string, cached: CachedEmployee): Promise<boolean> {
    if (Date.now() - cached.cachedAt >= CACHE_TTL_MS) return false;
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        accessVersion: true,
        status: true,
        permissionRoleAssignments: {
          where: activeAdditionalRoleAssignments(new Date()),
          select: { id: true },
        },
      },
    });
    if (!employee || employee.status === 'TERMINATED') {
      throw new UnauthorizedException('Account deactivated');
    }
    return (
      employee.accessVersion === cached.accessVersion &&
      (employee.permissionRoleAssignments ?? [])
        .map((item) => item.id)
        .sort()
        .join(',') === cached.assignmentIds
    );
  }

  private async withLiveOwnerFlag(
    employeeId: string,
    cached: CachedEmployee,
  ): Promise<CachedEmployee> {
    const isPlatformOwner = await this.platformOwnership.isPlatformOwner(employeeId);
    return {
      ...cached,
      isPlatformOwner,
      meProfile: { ...cached.meProfile, isPlatformOwner },
    };
  }
}
