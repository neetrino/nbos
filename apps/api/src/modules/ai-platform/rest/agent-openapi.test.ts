import { Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { AgentAuthGuard } from '../auth/agent-auth.guard';
import { AgentAuthenticatorService } from '../auth/agent-authenticator.service';
import { AgentCapabilityGateway } from '../gateway/agent-capability.gateway';
import { AgentUsageInterceptor } from '../auth/agent-usage.interceptor';
import { AgentPreAuthThrottleService } from '../limits/agent-preauth-throttle.service';
import { AgentPreAuthGuard } from '../limits/agent-preauth.guard';
import { AgentRateLimitGuard } from '../limits/agent-rate-limit.guard';
import { AgentRateLimitService } from '../limits/agent-rate-limit.service';
import { AgentMcpController } from '../mcp/agent-mcp.controller';
import { AgentMcpServer } from '../mcp/agent-mcp.server';
import { AgentCorrelationInterceptor } from '../protocol/agent-correlation.interceptor';
import { AGENT_OPENAPI_TAG } from '../protocol/agent-protocol.decorators';
import { AgentProtocolExceptionFilter } from '../protocol/agent-protocol.filter';
import { AgentProtocolInvoker } from '../protocol/agent-protocol.invoker';
import { listAgentOperations } from '../protocol/agent-operation.registry';
import { AgentArtifactsController } from './agent-artifacts.controller';
import { AgentIdentityController } from './agent-identity.controller';
import { AgentTasksController } from './agent-tasks.controller';

interface OpenApiOperation {
  tags?: string[];
  summary?: string;
  security?: unknown[];
}

type OpenApiPaths = Record<string, Record<string, OpenApiOperation>>;

/**
 * The published OpenAPI contract is generated from the live controllers, so
 * this asserts the real document rather than a hand-maintained copy
 * (checklist V 348).
 */
describe('agent REST OpenAPI contract', () => {
  let paths: OpenApiPaths;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [
        AgentIdentityController,
        AgentTasksController,
        AgentArtifactsController,
        AgentMcpController,
      ],
      providers: [
        Reflector,
        AgentRateLimitService,
        AgentProtocolInvoker,
        AgentMcpServer,
        AgentProtocolExceptionFilter,
        AgentCorrelationInterceptor,
        AgentPreAuthThrottleService,
        { provide: AgentPreAuthGuard, useValue: { canActivate: () => true } },
        { provide: AgentAuthGuard, useValue: { canActivate: () => true } },
        { provide: AgentRateLimitGuard, useValue: { canActivate: () => true } },
        {
          provide: AgentUsageInterceptor,
          useValue: {
            intercept: (_context: unknown, next: { handle: () => unknown }) => next.handle(),
          },
        },
        { provide: AgentAuthenticatorService, useValue: { authenticate: async () => undefined } },
        { provide: AgentCapabilityGateway, useValue: { invoke: async () => ({ data: null }) } },
      ],
    }).compile();

    const app: INestApplication = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    const config = new DocumentBuilder().setTitle('NBOS API').addBearerAuth().build();
    paths = SwaggerModule.createDocument(app, config).paths as OpenApiPaths;
    await app.close();
  });

  it('documents the versioned agent namespace', () => {
    const agentPaths = Object.keys(paths).filter((path) => path.startsWith('/api/v1/agent'));

    expect(agentPaths.length).toBeGreaterThan(0);
    for (const path of Object.keys(paths)) {
      expect(path.startsWith('/api/v1/agent')).toBe(true);
    }
  });

  it.each([
    ['/api/v1/agent/me', 'get'],
    ['/api/v1/agent/workspaces', 'get'],
    ['/api/v1/agent/workspaces/{workspaceId}', 'get'],
    ['/api/v1/agent/workspaces/{workspaceId}/tasks', 'get'],
    ['/api/v1/agent/workspaces/{workspaceId}/tasks', 'post'],
    ['/api/v1/agent/tasks/{taskId}', 'get'],
    ['/api/v1/agent/tasks/{taskId}', 'patch'],
    ['/api/v1/agent/tasks/{taskId}/start', 'post'],
    ['/api/v1/agent/tasks/{taskId}/comments', 'post'],
    ['/api/v1/agent/tasks/{taskId}/submit-review', 'post'],
    ['/api/v1/agent/tasks/{taskId}/discussion', 'get'],
    ['/api/v1/agent/tasks/{taskId}/artifacts', 'get'],
    ['/api/v1/agent/tasks/{taskId}/artifacts', 'post'],
    ['/api/v1/agent/tasks/{taskId}/artifacts/{fileAssetId}', 'get'],
    ['/api/v1/agent/mcp', 'post'],
  ])('publishes %s %s', (path, method) => {
    expect(paths[path]?.[method]).toBeDefined();
  });

  it('documents one REST operation per registry entry that has a route', () => {
    const documented = Object.values(paths).reduce(
      (total, methods) => total + Object.keys(methods).length,
      0,
    );

    // Every registry operation plus the MCP endpoint itself.
    expect(documented).toBe(listAgentOperations().length + 1);
  });

  it('marks every documented operation as bearer-authenticated and tagged', () => {
    for (const methods of Object.values(paths)) {
      for (const operation of Object.values(methods)) {
        expect(operation.tags).toContain(AGENT_OPENAPI_TAG);
        expect(operation.security).toBeDefined();
      }
    }
  });

  it('gives every operation a summary a client author can read', () => {
    for (const methods of Object.values(paths)) {
      for (const operation of Object.values(methods)) {
        expect(operation.summary?.length ?? 0).toBeGreaterThan(0);
      }
    }
  });

  it('publishes no delete operation', () => {
    for (const methods of Object.values(paths)) {
      expect(Object.keys(methods)).not.toContain('delete');
    }
  });
});
