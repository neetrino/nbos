import {
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
  Inject,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Observable } from 'rxjs';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { IS_PUBLIC_KEY } from '../decorators';

interface CachedEmployee {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roleLevel: number;
  departmentIds: string[];
  permissions: Record<string, string>;
  cachedAt: number;
}

const CACHE_TTL_MS = 60_000;

/**
 * Загружает полные данные Employee (роль, отделы, permissions) в request.user
 * после того, как AuthGuard уже верифицировал JWT и положил employeeId.
 */
@Injectable()
export class EmployeeInterceptor implements NestInterceptor {
  private cache = new Map<string, CachedEmployee>();
  private readonly logger = new Logger(EmployeeInterceptor.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<{
      user?: Record<string, unknown>;
    }>();

    const employeeId = request.user?.employeeId as string | undefined;
    if (!employeeId) {
      return next.handle();
    }

    const cached = this.cache.get(employeeId);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      request.user = { ...request.user, ...cached };
      return next.handle();
    }

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
        departments: true,
      },
    });

    if (!employee) {
      throw new UnauthorizedException('Employee not found');
    }

    const permissions: Record<string, string> = {};
    for (const rp of employee.role.permissions) {
      const key = `${rp.permission.module}_${rp.permission.action}`;
      permissions[key] = rp.scope;
    }

    const enriched: CachedEmployee = {
      id: employee.id,
      email: employee.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
      role: employee.role.slug,
      roleLevel: employee.role.level,
      departmentIds: employee.departments.map((d) => d.departmentId),
      permissions,
      cachedAt: Date.now(),
    };

    this.cache.set(employeeId, enriched);
    request.user = { ...request.user, ...enriched };

    return next.handle();
  }
}
