import {
  Injectable,
  CanActivate,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthSessionService } from '../../modules/auth/auth-session.service';

/**
 * Optional guard for high-risk endpoints: requires V2 sid and ACTIVE AuthSession.
 * Do not register globally.
 */
@Injectable()
export class RequireActiveSessionGuard implements CanActivate {
  constructor(private readonly authSessions: AuthSessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user?: { id?: string; employeeId?: string; sessionId?: string; tokenVersion?: number };
    }>();
    const user = request.user;
    const employeeId = user?.id ?? user?.employeeId;
    const sessionId = user?.sessionId;
    if (!employeeId || !sessionId || user?.tokenVersion !== 2) {
      throw new UnauthorizedException('Active session required');
    }
    await this.authSessions.assertSessionActive(sessionId, employeeId);
    return true;
  }
}
