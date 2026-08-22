import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { AgentAuthenticatorService } from './agent-authenticator.service';
import type { AgentAuthenticatedRequest } from './agent-auth.guard';

/**
 * Records `lastUsedAt` telemetry for agent requests that were admitted.
 *
 * Deliberately an interceptor rather than part of authentication: interceptors
 * run only after every guard has passed, so a credential that is over its
 * budget is refused without buying the two usage writes (checklist U 329).
 * The write stays best-effort and is never awaited by the request path.
 */
@Injectable()
export class AgentUsageInterceptor implements NestInterceptor {
  constructor(private readonly authenticator: AgentAuthenticatorService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AgentAuthenticatedRequest>();
    const agent = request.agent;
    const authContext = request.agentAuthContext;
    if (agent && authContext) {
      void this.authenticator.recordUsage(agent, authContext);
    }
    return next.handle();
  }
}
