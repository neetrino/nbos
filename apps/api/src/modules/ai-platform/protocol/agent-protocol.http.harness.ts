import { Controller, Get, INestApplication, Provider, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { Test } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import { vi, type Mock } from 'vitest';
import { RequirePermission } from '../../../common/decorators';
import { GlobalExceptionFilter } from '../../../common/filters/http-exception.filter';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { EmployeeGuard } from '../../../common/guards/employee.guard';
import { OriginGuard } from '../../../common/guards/origin.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { RequireActiveSessionGuard } from '../../../common/guards/require-active-session.guard';
import { TransformInterceptor } from '../../../common/interceptors/transform.interceptor';
import { PRISMA_TOKEN } from '../../../database.module';
import { authenticatedAgentFixture } from '../../../test-utils/authenticated-agent';
import { AuthSessionService } from '../../auth/auth-session.service';
import { PlatformOwnershipService } from '../../platform-ownership/platform-ownership.service';
import { AgentAuthGuard } from '../auth/agent-auth.guard';
import { AgentAuthenticatorService } from '../auth/agent-authenticator.service';
import { AgentAccessException } from '../auth/agent-auth.errors';
import { parseAgentToken } from '../credentials/agent-token';
import { AgentCapabilityGateway } from '../gateway/agent-capability.gateway';
import { AgentMcpController } from '../mcp/agent-mcp.controller';
import { AgentMcpServer } from '../mcp/agent-mcp.server';
import { AgentArtifactsController } from '../rest/agent-artifacts.controller';
import { AgentIdentityController } from '../rest/agent-identity.controller';
import { AgentTasksController } from '../rest/agent-tasks.controller';
import { AgentCorrelationInterceptor } from './agent-correlation.interceptor';
import { AgentProtocolExceptionFilter } from './agent-protocol.filter';
import { AgentProtocolInvoker } from './agent-protocol.invoker';

/** Well-formed for `parseAgentToken`: `nbos_agt_<18 hex>_<64 hex>`. */
export const AGENT_TOKEN = `nbos_agt_${'aabbccddeeff001122'}_${'a1'.repeat(32)}`;
export const AGENT_TOKEN_SECRET = 'a1'.repeat(32);

const JWT_SECRET = 'test-jwt-secret';
const THROTTLE_LIMIT = 500;
const THROTTLE_TTL_MS = 60_000;
const EMPLOYEE_TOKEN_TTL = '5m';

/** Stands in for any employee route: RBAC must keep working next to the agent namespace. */
@Controller('tasks')
class EmployeeProbeController {
  @Get('probe')
  @RequirePermission('TASKS', 'VIEW')
  probe(): { ok: boolean } {
    return { ok: true };
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
      sub: 'employee-1',
      sid: 'session-1',
      typ: 'access',
      ver: 2,
      authVersion: 1,
      email: 'employee@nbos.test',
    },
    JWT_SECRET,
    { expiresIn: EMPLOYEE_TOKEN_TTL },
  );
}

export interface AgentProtocolHarness {
  baseUrl: string;
  authenticate: Mock;
  gatewayInvoke: Mock;
  /** Request against the agent namespace with a valid agent bearer token. */
  agentFetch(path: string, init?: RequestInit): Promise<Response>;
  /** Request with no credential, or with one supplied by the caller. */
  rawFetch(path: string, init?: RequestInit): Promise<Response>;
  resetMocks(): void;
  close(): Promise<void>;
}

/**
 * The production cross-cutting stack, in production order. Only the credential
 * authenticator and the capability gateway are substituted; every guard, pipe,
 * interceptor and filter is the real class.
 */
function harnessProviders(authenticate: Mock, gatewayInvoke: Mock): Provider[] {
  return [
    Reflector,
    AgentAuthGuard,
    AgentProtocolInvoker,
    AgentMcpServer,
    AgentProtocolExceptionFilter,
    AgentCorrelationInterceptor,
    { provide: AgentAuthenticatorService, useValue: { authenticate } },
    { provide: AgentCapabilityGateway, useValue: { invoke: gatewayInvoke } },
    { provide: ConfigService, useValue: { getOrThrow: () => JWT_SECRET } },
    { provide: PRISMA_TOKEN, useValue: {} },
    { provide: PlatformOwnershipService, useValue: { isPlatformOwner: async () => false } },
    { provide: AuthSessionService, useValue: { assertSessionActive: async () => undefined } },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: OriginGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: EmployeeGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
    { provide: APP_GUARD, useClass: RequireActiveSessionGuard },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ];
}

async function listenOnEphemeralPort(
  authenticate: Mock,
  gatewayInvoke: Mock,
): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ThrottlerModule.forRoot({ throttlers: [{ ttl: THROTTLE_TTL_MS, limit: THROTTLE_LIMIT }] }),
    ],
    controllers: [
      AgentIdentityController,
      AgentTasksController,
      AgentArtifactsController,
      AgentMcpController,
      EmployeeProbeController,
    ],
    providers: harnessProviders(authenticate, gatewayInvoke),
  }).compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.setGlobalPrefix('api');
  await app.listen(0);
  return app;
}

/**
 * Default behaviour: the substituted authenticator still applies the real
 * canonical token parse, so a non-agent bearer token is refused here for the
 * same reason it is refused in production.
 */
function applyDefaultMockBehaviour(authenticate: Mock, gatewayInvoke: Mock): void {
  authenticate.mockReset();
  gatewayInvoke.mockReset();
  authenticate.mockImplementation(async (rawToken: string) => {
    if (!parseAgentToken(rawToken)) {
      throw AgentAccessException.fromDenyReason('CREDENTIAL_INVALID');
    }
    return authenticatedAgentFixture();
  });
  gatewayInvoke.mockResolvedValue({ capabilityKey: 'tasks.read', data: { id: 'task-1' } });
}

/**
 * Boots the agent controllers behind the production guard chain.
 *
 * This harness is what makes the Employee-vs-Agent boundary (checklist G 140)
 * testable: the agent namespace is mounted behind the same global
 * `ThrottlerGuard → OriginGuard → AuthGuard → EmployeeGuard → PermissionGuard →
 * RequireActiveSessionGuard` stack, the same `ValidationPipe`, the same
 * `TransformInterceptor` and the same `GlobalExceptionFilter` as production, so
 * routing, guard order and envelope behaviour under test are the real thing.
 */
export async function startAgentProtocolHarness(): Promise<AgentProtocolHarness> {
  const authenticate = vi.fn();
  const gatewayInvoke = vi.fn();
  const app = await listenOnEphemeralPort(authenticate, gatewayInvoke);
  const baseUrl = `${await app.getUrl()}/api`;
  const resetMocks = (): void => applyDefaultMockBehaviour(authenticate, gatewayInvoke);

  resetMocks();

  return {
    baseUrl,
    authenticate,
    gatewayInvoke,
    agentFetch: (path, init = {}) =>
      fetch(`${baseUrl}${path}`, {
        ...init,
        headers: { authorization: `Bearer ${AGENT_TOKEN}`, ...(init.headers ?? {}) },
      }),
    rawFetch: (path, init = {}) => fetch(`${baseUrl}${path}`, init),
    resetMocks,
    close: async () => {
      await app.close();
    },
  };
}
