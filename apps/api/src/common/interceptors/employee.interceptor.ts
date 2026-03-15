import {
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
  Inject,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import type { Observable } from 'rxjs';
import { createClerkClient } from '@clerk/backend';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { IS_PUBLIC_KEY } from '../decorators';

interface CachedEmployee {
  id: string;
  clerkUserId: string;
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
 * после того, как AuthGuard уже верифицировал JWT.
 * Если Employee не найден — автоматически создаёт с ролью observer.
 */
@Injectable()
export class EmployeeInterceptor implements NestInterceptor {
  private cache = new Map<string, CachedEmployee>();
  private readonly logger = new Logger(EmployeeInterceptor.name);
  private readonly clerkSecretKey: string;

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    this.clerkSecretKey = this.configService.get<string>('CLERK_SECRET_KEY') ?? '';
  }

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

    const clerkUserId = request.user?.clerkUserId as string | undefined;
    if (!clerkUserId) {
      return next.handle();
    }

    const cached = this.cache.get(clerkUserId);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      request.user = { ...request.user, ...cached };
      return next.handle();
    }

    let employee = await this.findEmployeeWithPermissions(clerkUserId);

    if (!employee) {
      employee = await this.autoProvisionEmployee(clerkUserId);
      if (!employee) {
        return next.handle();
      }
    }

    const permissions: Record<string, string> = {};
    for (const rp of employee.role.permissions) {
      const key = `${rp.permission.module}_${rp.permission.action}`;
      permissions[key] = rp.scope;
    }

    const enriched: CachedEmployee = {
      id: employee.id,
      clerkUserId: employee.clerkUserId ?? '',
      email: employee.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
      role: employee.role.slug,
      roleLevel: employee.role.level,
      departmentIds: employee.departments.map((d) => d.departmentId),
      permissions,
      cachedAt: Date.now(),
    };

    this.cache.set(clerkUserId, enriched);
    request.user = { ...request.user, ...enriched };

    return next.handle();
  }

  private async findEmployeeWithPermissions(clerkUserId: string) {
    return this.prisma.employee.findUnique({
      where: { clerkUserId },
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
  }

  /**
   * Автоматически связывает или создаёт Employee для Clerk-пользователя.
   *
   * 1. Получает email/имя из Clerk API
   * 2. Ищет существующий Employee по email (seed data без clerkUserId)
   *    → если нашёл, привязывает clerkUserId
   * 3. Проверяет Invitation → если есть pending, берёт roleId оттуда
   * 4. Иначе создаёт нового Employee с ролью observer
   */
  private async autoProvisionEmployee(clerkUserId: string) {
    try {
      const clerk = createClerkClient({ secretKey: this.clerkSecretKey });
      const clerkUser = await clerk.users.getUser(clerkUserId);

      const email = clerkUser.emailAddresses[0]?.emailAddress ?? '';
      const firstName = clerkUser.firstName ?? '';
      const lastName = clerkUser.lastName ?? '';

      if (email) {
        const existingByEmail = await this.prisma.employee.findUnique({
          where: { email },
        });

        if (existingByEmail && !existingByEmail.clerkUserId) {
          await this.prisma.employee.update({
            where: { id: existingByEmail.id },
            data: {
              clerkUserId,
              firstName: firstName || existingByEmail.firstName,
              lastName: lastName || existingByEmail.lastName,
            },
          });

          this.logger.log(
            `Linked Clerk user ${clerkUserId} to existing employee ${existingByEmail.id} (${email})`,
          );
          return this.findEmployeeWithPermissions(clerkUserId);
        }
      }

      const observerRole = await this.prisma.role.findUnique({
        where: { slug: 'observer' },
      });
      if (!observerRole) {
        this.logger.warn('Observer role not found, cannot auto-provision employee');
        return null;
      }

      const invitation = email
        ? await this.prisma.invitation.findUnique({ where: { email } })
        : null;

      const roleId =
        invitation && invitation.status === 'PENDING' ? invitation.roleId : observerRole.id;

      const created = await this.prisma.employee.create({
        data: {
          clerkUserId,
          email,
          firstName,
          lastName,
          roleId,
        },
      });

      if (invitation && invitation.status === 'PENDING') {
        await this.prisma.invitation.update({
          where: { id: invitation.id },
          data: { status: 'ACCEPTED', employeeId: created.id },
        });

        if (invitation.departmentId) {
          await this.prisma.employeeDepartment.create({
            data: {
              employeeId: created.id,
              departmentId: invitation.departmentId,
              isPrimary: true,
            },
          });
        }
      }

      this.logger.log(`Auto-provisioned employee ${created.id} (${email}) with role ${roleId}`);

      return this.findEmployeeWithPermissions(clerkUserId);
    } catch (err) {
      this.logger.error('Failed to auto-provision employee', err);
      return null;
    }
  }
}
