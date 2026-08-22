import {
  applyDecorators,
  createParamDecorator,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../../common/decorators';
import { SkipTransform } from '../../../common/decorators/skip-transform.decorator';
import type { AuthenticatedAgent } from '../auth/agent-authenticator.service';
import { AgentAuthGuard } from '../auth/agent-auth.guard';
import { AgentUsageInterceptor } from '../auth/agent-usage.interceptor';
import { AgentPreAuthGuard } from '../limits/agent-preauth.guard';
import { AgentRateLimitGuard } from '../limits/agent-rate-limit.guard';
import { AgentCorrelationInterceptor } from './agent-correlation.interceptor';
import { AgentProtocolExceptionFilter } from './agent-protocol.filter';
import { requireAuthenticatedAgent, type AgentProtocolRequest } from './agent-protocol.request';

export const AGENT_REST_NAMESPACE = 'v1/agent';
export const AGENT_IDEMPOTENCY_HEADER = 'Idempotency-Key';
export const AGENT_OPENAPI_TAG = 'External Agent';

/**
 * Cross-cutting wiring every agent route needs.
 *
 * `@Public()` is what closes the Employee-vs-Agent boundary: the global
 * `AuthGuard`/`EmployeeGuard` chain skips these routes entirely instead of
 * running beside `AgentAuthGuard`, so an agent credential can never be
 * enriched into `request.user` and an employee JWT can never reach a
 * capability. `@SkipTransform()` and the filter replace the employee
 * `{ data, timestamp }` / `{ statusCode, message }` bodies with the machine
 * envelope from the `09` contract.
 *
 * `@SkipThrottle()` is the other half of that boundary: agent traffic is
 * metered by its own budgets instead of consuming the employee-default
 * `ThrottlerGuard` capacity, so one abusive credential cannot throttle the
 * human API (checklist U 329). Those budgets are what replaces it, in order:
 * `AgentPreAuthGuard` meters the source address before any credential work,
 * `AgentAuthGuard` resolves the principal, `AgentRateLimitGuard` charges the
 * per-agent budget, and only then does `AgentUsageInterceptor` write usage
 * telemetry for the admitted request.
 */
export function AgentProtocolEndpoints(): ClassDecorator {
  return applyDecorators(
    ApiTags(AGENT_OPENAPI_TAG),
    ApiBearerAuth(),
    Public(),
    SkipThrottle(),
    UseGuards(AgentPreAuthGuard, AgentAuthGuard, AgentRateLimitGuard),
    UseFilters(AgentProtocolExceptionFilter),
    UseInterceptors(AgentCorrelationInterceptor, AgentUsageInterceptor),
    SkipTransform(),
  );
}

export const CurrentAgent = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedAgent =>
    requireAuthenticatedAgent(context.switchToHttp().getRequest<AgentProtocolRequest>()),
);

/** Correlation id minted by `AgentAuthGuard` for this request. */
export const CurrentCorrelationId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string =>
    context.switchToHttp().getRequest<AgentProtocolRequest>().agentCorrelationId ?? '',
);
