import { Controller, Get, Post } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { RequireActiveSession, RequirePermission } from '../../../common/decorators';

export const HARNESS_JWT_SECRET = 'test-jwt-secret';
const EMPLOYEE_TOKEN_TTL = '5m';
const EMPLOYEE_ID = 'employee-1';

/** Stands in for any employee route: RBAC must keep working next to the agent namespace. */
@Controller('tasks')
export class EmployeeProbeController {
  @Get('probe')
  @RequirePermission('TASKS', 'VIEW')
  probe(): { ok: boolean } {
    return { ok: true };
  }
}

/**
 * Mirrors the shape of the Credentials vault reveal route: employee permission
 * plus an active session. An agent credential must never reach it (AL 603).
 */
@Controller('credentials')
export class CredentialsSecretProbeController {
  @Post(':id/secrets/reveal')
  @RequirePermission('CREDENTIALS', 'VIEW')
  @RequireActiveSession()
  reveal(): { password: string } {
    return { password: 'vault-plaintext-must-not-be-reachable' };
  }
}

/**
 * A genuine v2 access token that `AuthGuard` accepts. Used to prove that a
 * real employee session is still refused on the agent namespace — a token the
 * guard chain would honour elsewhere.
 */
export function signEmployeeAccessToken(): string {
  return jwt.sign(
    {
      sub: EMPLOYEE_ID,
      sid: 'session-1',
      typ: 'access',
      ver: 2,
      authVersion: 1,
      email: 'employee@nbos.test',
    },
    HARNESS_JWT_SECRET,
    { expiresIn: EMPLOYEE_TOKEN_TTL },
  );
}

/**
 * Prisma double that lets `EmployeeGuard` enrich a real employee.
 *
 * Without it the employee probe answers 500 and an isolation test could pass
 * while the human API was in fact broken, which is exactly the false positive
 * checklist U 329 must not rely on.
 */
export function createEmployeeProbePrisma(): {
  employee: { findUnique: () => Promise<unknown> };
} {
  return {
    employee: {
      findUnique: async () => ({
        id: EMPLOYEE_ID,
        email: 'employee@nbos.test',
        firstName: 'Test',
        lastName: 'Employee',
        phone: null,
        telegram: null,
        avatar: null,
        position: null,
        status: 'ACTIVE',
        role: {
          id: 'role-1',
          name: 'Administrator',
          slug: 'admin',
          level: 90,
          permissions: [
            { scope: 'ALL', permission: { module: 'TASKS', action: 'VIEW' } },
            { scope: 'ALL', permission: { module: 'CREDENTIALS', action: 'VIEW' } },
          ],
        },
        departments: [],
      }),
    },
  };
}
