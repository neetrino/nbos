import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { THROTTLER_LIMIT, THROTTLER_TTL } from '@nestjs/throttler/dist/throttler.constants';
import { PERMISSION_KEY } from '../../common/decorators/require-permission.decorator';
import { REQUIRE_ACTIVE_SESSION_KEY } from '../../common/decorators/require-active-session.decorator';
import { EmployeeSecurityAdminController } from './employee-security-admin.controller';

/**
 * Guards read this metadata at runtime, so losing a decorator would silently open an owner-only
 * route. Service-level tests cannot catch that.
 */
describe('EmployeeSecurityAdminController route guards', () => {
  const handlers = {
    sendPasswordResetLink: EmployeeSecurityAdminController.prototype.sendPasswordResetLink,
    revokeSessions: EmployeeSecurityAdminController.prototype.revokeSessions,
  };

  for (const [name, handler] of Object.entries(handlers)) {
    describe(name, () => {
      it('requires COMPANY EDIT', () => {
        expect(Reflect.getMetadata(PERMISSION_KEY, handler)).toEqual({
          module: 'COMPANY',
          action: 'EDIT',
        });
      });

      it('requires an active V2 session', () => {
        expect(Reflect.getMetadata(REQUIRE_ACTIVE_SESSION_KEY, handler)).toBe(true);
      });

      it('keeps the forgot-password throttle window', () => {
        expect(Reflect.getMetadata(`${THROTTLER_LIMIT}default`, handler)).toBe(5);
        expect(Reflect.getMetadata(`${THROTTLER_TTL}default`, handler)).toBe(600_000);
      });
    });
  }
});
