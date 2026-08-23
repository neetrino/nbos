import {
  Injectable,
  CanActivate,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthSessionService } from '../../modules/auth/auth-session.service';
import { REQUIRE_ACTIVE_SESSION_KEY } from '../decorators/require-active-session.decorator';

/**
 * High-risk routes only (via `@RequireActiveSession`).
 * Requires an ACTIVE AuthSession V2 row.
 */
@Injectable()
export class RequireActiveSessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authSessions: AuthSessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<boolean>(REQUIRE_ACTIVE_SESSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const request = context.switchToHttp().getRequest<{
      user?: { id?: string; employeeId?: string; sessionId?: string; tokenVersion?: number };
    }>();
    const user = request.user;
    const employeeId = user?.id ?? user?.employeeId;
    const sessionId = user?.sessionId;

    if (user?.tokenVersion === 2 && employeeId && sessionId) {
      await this.authSessions.assertSessionActive(sessionId, employeeId);
      return true;
    }

    throw new UnauthorizedException('Active session required');
  }
}
