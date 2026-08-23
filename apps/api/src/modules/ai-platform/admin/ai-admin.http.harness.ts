import { ValidationPipe, type Provider } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { Test } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import { vi, type Mock } from 'vitest';
import { GlobalExceptionFilter } from '../../../common/filters/http-exception.filter';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { EmployeeGuard } from '../../../common/guards/employee.guard';
import { OriginGuard } from '../../../common/guards/origin.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { RequireActiveSessionGuard } from '../../../common/guards/require-active-session.guard';
import { TransformInterceptor } from '../../../common/interceptors/transform.interceptor';
import { PRISMA_TOKEN } from '../../../database.module';
import { AuthSessionService } from '../../auth/auth-session.service';
import { AuditService } from '../../audit/audit.service';
import { PlatformOwnershipService } from '../../platform-ownership/platform-ownership.service';
import { ExternalAgentService } from '../agents/external-agent.service';
import { AgentCredentialService } from '../credentials/agent-credential.service';
import { AgentGrantService } from '../grants/agent-grant.service';
import { InternalAgentGrantService } from '../internal-agents/internal-agent-grant.service';
import { InternalAgentService } from '../internal-agents/internal-agent.service';
import { AiModelCatalogService } from '../models/ai-model-catalog.service';
import { AiModelSyncService } from '../models/ai-model-sync.service';
import { AiModelPolicyService } from '../policies/ai-model-policy.service';
import { AiProviderConnectionService } from '../providers/ai-provider-connection.service';
import { AiAdminExternalAgentAccessController } from './ai-admin-external-agent-access.controller';
import { AiAdminExternalAgentsController } from './ai-admin-external-agents.controller';
import { AiAdminOverviewController } from './ai-admin-overview.controller';
import { AiAdminProvidersController } from './ai-admin-providers.controller';
import { AiAdminQueryService } from './ai-admin-query.service';
import { AiAdminWorkspaceAccessController } from './ai-admin-workspace-access.controller';
import { AiAdminPromptPoliciesController } from './ai-admin-prompt-policies.controller';
import { AiAdminApprovalsController } from './ai-admin-approvals.controller';
import { AiPromptPolicyService } from '../prompts/ai-prompt-policy.service';
import { AiApprovalRequestService } from '../approvals/ai-approval-request.service';
import { AGENT_TOKEN } from '../protocol/agent-protocol.http.harness';

export const AI_ADMIN_JWT_SECRET = 'test-jwt-secret';
const EMPLOYEE_ID = 'employee-1';
const THROTTLE_LIMIT = 500;
const THROTTLE_TTL_MS = 60_000;
const EMPLOYEE_TOKEN_TTL = '5m';

export function signAdminEmployeeToken(employeeId = EMPLOYEE_ID): string {
  return jwt.sign(
    {
      sub: employeeId,
      sid: `session-${employeeId}`,
      typ: 'access',
      ver: 2,
      authVersion: 1,
      email: `${employeeId}@nbos.test`,
    },
    AI_ADMIN_JWT_SECRET,
    { expiresIn: EMPLOYEE_TOKEN_TTL },
  );
}

export function employeeRecord(hasCompanyEdit: boolean, employeeId = EMPLOYEE_ID) {
  return {
    id: employeeId,
    email: `${employeeId}@nbos.test`,
    firstName: 'Ada',
    lastName: 'Admin',
    status: 'ACTIVE',
    phone: null,
    telegram: null,
    avatar: null,
    position: null,
    role: {
      id: 'role-1',
      name: 'Admin',
      slug: 'admin',
      level: 100,
      permissions: hasCompanyEdit
        ? [{ permission: { module: 'COMPANY', action: 'EDIT' }, scope: 'ALL' }]
        : [],
    },
    departments: [],
  };
}

export interface AiAdminHarness {
  baseUrl: string;
  services: ReturnType<typeof createServiceMocks>;
  setEmployeeAccess(hasCompanyEdit: boolean, employeeId?: string): void;
  employeeFetch(path: string, init?: RequestInit & { employeeId?: string }): Promise<Response>;
  rawFetch(path: string, init?: RequestInit): Promise<Response>;
  close(): Promise<void>;
}

function createServiceMocks() {
  return {
    agents: {
      create: vi.fn(),
      update: vi.fn(),
      disable: vi.fn(),
      enable: vi.fn(),
      revoke: vi.fn(),
      findById: vi.fn(),
      listAll: vi.fn(),
    },
    credentials: {
      issue: vi.fn(),
      rotate: vi.fn(),
      revoke: vi.fn(),
      listForAgent: vi.fn(),
      requireOnAgent: vi.fn(),
    },
    grants: {
      grantCapability: vi.fn(),
      revokeCapability: vi.fn(),
      grantScope: vi.fn(),
      revokeScope: vi.fn(),
      listCapabilities: vi.fn(),
      listScopes: vi.fn(),
      listActiveWorkspaceScopes: vi.fn(),
      requireScopeOnAgent: vi.fn(),
      requireScopeOnWorkspace: vi.fn(),
    },
    connections: {
      create: vi.fn(),
      update: vi.fn(),
      rotateKey: vi.fn(),
      validate: vi.fn(),
      validateDraft: vi.fn(),
      validateReplacementKey: vi.fn(),
      disable: vi.fn(),
      enable: vi.fn(),
      revoke: vi.fn(),
      findById: vi.fn(),
      listAll: vi.fn(),
    },
    catalog: { listAll: vi.fn(), findById: vi.fn(), activate: vi.fn(), disable: vi.fn() },
    sync: { syncConnection: vi.fn(), syncAllEnabledConnections: vi.fn() },
    policies: { listAll: vi.fn(), create: vi.fn(), findById: vi.fn() },
    internalAgents: { listAll: vi.fn(), create: vi.fn(), findById: vi.fn(), activate: vi.fn() },
    internalGrants: { listCapabilities: vi.fn(), listScopes: vi.fn() },
    prompts: {
      listAll: vi.fn(),
      create: vi.fn(),
      findById: vi.fn(),
      createVersion: vi.fn(),
      updateDraft: vi.fn(),
      markTesting: vi.fn(),
      publish: vi.fn(),
      rollback: vi.fn(),
    },
    approvals: {
      listPending: vi.fn(),
      findById: vi.fn(),
      approve: vi.fn(),
      reject: vi.fn(),
      cancel: vi.fn(),
    },
    audit: {
      findRecentByEntityTypes: vi.fn(),
      findByEntity: vi.fn(),
      findRecentByEntityRefs: vi.fn(),
    },
  };
}

function harnessProviders(
  services: ReturnType<typeof createServiceMocks>,
  employeeFindUnique: Mock,
): Provider[] {
  return [
    Reflector,
    AiAdminQueryService,
    { provide: ExternalAgentService, useValue: services.agents },
    { provide: AgentCredentialService, useValue: services.credentials },
    { provide: AgentGrantService, useValue: services.grants },
    { provide: AiProviderConnectionService, useValue: services.connections },
    { provide: AiModelCatalogService, useValue: services.catalog },
    { provide: AiModelSyncService, useValue: services.sync },
    { provide: AiModelPolicyService, useValue: services.policies },
    { provide: InternalAgentService, useValue: services.internalAgents },
    { provide: InternalAgentGrantService, useValue: services.internalGrants },
    { provide: AiPromptPolicyService, useValue: services.prompts },
    { provide: AiApprovalRequestService, useValue: services.approvals },
    { provide: AuditService, useValue: services.audit },
    { provide: ConfigService, useValue: { getOrThrow: () => AI_ADMIN_JWT_SECRET } },
    {
      provide: PRISMA_TOKEN,
      useValue: { employee: { findUnique: employeeFindUnique } },
    },
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

export async function startAiAdminHarness(): Promise<AiAdminHarness> {
  const services = createServiceMocks();
  const employeeFindUnique = vi.fn().mockResolvedValue(employeeRecord(true));
  const moduleRef = await Test.createTestingModule({
    imports: [
      ThrottlerModule.forRoot({ throttlers: [{ ttl: THROTTLE_TTL_MS, limit: THROTTLE_LIMIT }] }),
    ],
    controllers: [
      AiAdminOverviewController,
      AiAdminExternalAgentsController,
      AiAdminExternalAgentAccessController,
      AiAdminProvidersController,
      AiAdminWorkspaceAccessController,
      AiAdminPromptPoliciesController,
      AiAdminApprovalsController,
    ],
    providers: harnessProviders(services, employeeFindUnique),
  }).compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.setGlobalPrefix('api');
  await app.listen(0);
  const baseUrl = `${await app.getUrl()}/api`;

  return {
    baseUrl,
    services,
    setEmployeeAccess: (hasCompanyEdit, employeeId = EMPLOYEE_ID) => {
      employeeFindUnique.mockImplementation(async (args: { where: { id: string } }) =>
        employeeRecord(hasCompanyEdit && args.where.id === EMPLOYEE_ID, args.where.id),
      );
      void employeeId;
    },
    employeeFetch: (path, init = {}) => {
      const { employeeId = EMPLOYEE_ID, ...requestInit } = init;
      return fetch(`${baseUrl}${path}`, {
        ...requestInit,
        headers: {
          authorization: `Bearer ${signAdminEmployeeToken(employeeId)}`,
          'content-type': 'application/json',
          ...(requestInit.headers ?? {}),
        },
      });
    },
    rawFetch: (path, init = {}) => fetch(`${baseUrl}${path}`, init),
    close: async () => {
      await app.close();
    },
  };
}

export { AGENT_TOKEN };
