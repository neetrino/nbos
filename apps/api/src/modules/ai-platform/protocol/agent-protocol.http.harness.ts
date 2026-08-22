import { INestApplication, Provider, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { Test } from '@nestjs/testing';
import { json } from 'express';
import { vi, type Mock } from 'vitest';
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
import { AgentUsageInterceptor } from '../auth/agent-usage.interceptor';
import { parseAgentToken } from '../credentials/agent-token';
import { AgentCapabilityGateway } from '../gateway/agent-capability.gateway';
import {
  AGENT_HTTP_PATH_PREFIX,
  createAgentBodyLimitErrorHandler,
  createAgentJsonBodyParser,
} from '../limits/agent-body-limit.middleware';
import { AgentPreAuthThrottleService } from '../limits/agent-preauth-throttle.service';
import { AgentPreAuthGuard } from '../limits/agent-preauth.guard';
import { AgentRateLimitGuard } from '../limits/agent-rate-limit.guard';
import { AgentRateLimitService } from '../limits/agent-rate-limit.service';
import { AgentMcpController } from '../mcp/agent-mcp.controller';
import { AgentMcpServer } from '../mcp/agent-mcp.server';
import { AgentArtifactsController } from '../rest/agent-artifacts.controller';
import { AgentIdentityController } from '../rest/agent-identity.controller';
import { AgentTasksController } from '../rest/agent-tasks.controller';
import { AgentCorrelationInterceptor } from './agent-correlation.interceptor';
import {
  createEmployeeProbePrisma,
  CredentialsSecretProbeController,
  EmployeeProbeController,
  HARNESS_JWT_SECRET,
} from './agent-protocol.harness.employee';
import { AgentProtocolExceptionFilter } from './agent-protocol.filter';
import { AgentProtocolInvoker } from './agent-protocol.invoker';

export { signEmployeeAccessToken } from './agent-protocol.harness.employee';

/** Well-formed for `parseAgentToken`: `nbos_agt_<18 hex>_<64 hex>`. */
export const AGENT_TOKEN = `nbos_agt_${'aabbccddeeff001122'}_${'a1'.repeat(32)}`;
export const AGENT_TOKEN_SECRET = 'a1'.repeat(32);

/** Same value as `main.ts`, so payload behaviour under test is production behaviour. */
const JSON_BODY_LIMIT = '1mb';
const THROTTLE_LIMIT = 500;
const THROTTLE_TTL_MS = 60_000;

export interface AgentProtocolHarnessOptions {
  /**
   * Employee-default `ThrottlerGuard` ceiling. A small value makes the
   * employee-capacity isolation of checklist U 329 observable in a test.
   */
  employeeThrottleLimit?: number;
}

export interface AgentProtocolHarness {
  baseUrl: string;
  authenticate: Mock;
  recordUsage: Mock;
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
function harnessProviders(mocks: {
  authenticate: Mock;
  recordUsage: Mock;
  gatewayInvoke: Mock;
}): Provider[] {
  return [
    Reflector,
    AgentPreAuthThrottleService,
    AgentPreAuthGuard,
    AgentAuthGuard,
    AgentUsageInterceptor,
    AgentRateLimitService,
    AgentRateLimitGuard,
    AgentProtocolInvoker,
    AgentMcpServer,
    AgentProtocolExceptionFilter,
    AgentCorrelationInterceptor,
    {
      provide: AgentAuthenticatorService,
      useValue: { authenticate: mocks.authenticate, recordUsage: mocks.recordUsage },
    },
    { provide: AgentCapabilityGateway, useValue: { invoke: mocks.gatewayInvoke } },
    { provide: ConfigService, useValue: { getOrThrow: () => HARNESS_JWT_SECRET } },
    { provide: PRISMA_TOKEN, useValue: createEmployeeProbePrisma() },
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
  mocks: { authenticate: Mock; recordUsage: Mock; gatewayInvoke: Mock },
  employeeThrottleLimit: number,
): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ThrottlerModule.forRoot({
        throttlers: [{ ttl: THROTTLE_TTL_MS, limit: employeeThrottleLimit }],
      }),
    ],
    controllers: [
      AgentIdentityController,
      AgentTasksController,
      AgentArtifactsController,
      AgentMcpController,
      EmployeeProbeController,
      CredentialsSecretProbeController,
    ],
    providers: harnessProviders(mocks),
  }).compile();

  // Mirrors `main.ts`: the agent-scoped parser, then the employee transport cap,
  // then the error handler that renders transport refusals in the `09`
  // envelope. Anything else would test a payload path production does not have.
  const app = moduleRef.createNestApplication({ bodyParser: false });
  app.use(AGENT_HTTP_PATH_PREFIX, createAgentJsonBodyParser());
  app.use(json({ limit: JSON_BODY_LIMIT }));
  app.use(createAgentBodyLimitErrorHandler());
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
function applyDefaultMockBehaviour(mocks: {
  authenticate: Mock;
  recordUsage: Mock;
  gatewayInvoke: Mock;
}): void {
  mocks.authenticate.mockReset();
  mocks.recordUsage.mockReset();
  mocks.gatewayInvoke.mockReset();
  mocks.authenticate.mockImplementation(async (rawToken: string) => {
    if (!parseAgentToken(rawToken)) {
      throw AgentAccessException.fromDenyReason('CREDENTIAL_INVALID');
    }
    return authenticatedAgentFixture();
  });
  mocks.recordUsage.mockResolvedValue(undefined);
  mocks.gatewayInvoke.mockResolvedValue({ capabilityKey: 'tasks.read', data: { id: 'task-1' } });
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
export async function startAgentProtocolHarness(
  options: AgentProtocolHarnessOptions = {},
): Promise<AgentProtocolHarness> {
  const mocks = { authenticate: vi.fn(), recordUsage: vi.fn(), gatewayInvoke: vi.fn() };
  const app = await listenOnEphemeralPort(mocks, options.employeeThrottleLimit ?? THROTTLE_LIMIT);
  const baseUrl = `${await app.getUrl()}/api`;
  const resetMocks = (): void => applyDefaultMockBehaviour(mocks);

  resetMocks();

  return {
    baseUrl,
    authenticate: mocks.authenticate,
    recordUsage: mocks.recordUsage,
    gatewayInvoke: mocks.gatewayInvoke,
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
