import { Module, type OnModuleInit } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuditService } from '../audit/audit.service';
import { DriveModule } from '../drive/drive.module';
import { TasksModule } from '../tasks/tasks.module';
import { ExternalAgentService } from './agents/external-agent.service';
import { AiPlatformAuditService } from './ai-platform-audit.service';
import { AgentAuthGuard } from './auth/agent-auth.guard';
import { AgentAuthenticatorService } from './auth/agent-authenticator.service';
import { AgentCredentialService } from './credentials/agent-credential.service';
import { primeAgentSecretVerifier } from './credentials/agent-secret-hash';
import { AgentGrantService } from './grants/agent-grant.service';
import { AgentCapabilityGateway } from './gateway/agent-capability.gateway';
import { AgentDriveHandler } from './gateway/agent-drive.handler';
import { AgentIdempotencyService } from './gateway/agent-idempotency.service';
import { AgentTaskAccess } from './gateway/agent-task-access';
import { AgentTaskReadHandler } from './gateway/agent-task-read.handler';
import { AgentTaskWriteHandler } from './gateway/agent-task-write.handler';
import { AgentWorkspaceHandler } from './gateway/agent-workspace.handler';
import { InternalAgentGrantService } from './internal-agents/internal-agent-grant.service';
import { InternalAgentService } from './internal-agents/internal-agent.service';
import { AgentMcpController } from './mcp/agent-mcp.controller';
import { AgentMcpServer } from './mcp/agent-mcp.server';
import { AiModelCatalogService } from './models/ai-model-catalog.service';
import { AiModelSyncService } from './models/ai-model-sync.service';
import { AiModelPolicyResolver } from './policies/ai-model-policy.resolver';
import { AiModelPolicyService } from './policies/ai-model-policy.service';
import { AgentPolicyService } from './policy/agent-policy.service';
import { AgentCorrelationInterceptor } from './protocol/agent-correlation.interceptor';
import { AgentProtocolExceptionFilter } from './protocol/agent-protocol.filter';
import { AgentProtocolInvoker } from './protocol/agent-protocol.invoker';
import { AnthropicAdapter } from './providers/anthropic.adapter';
import { AiProviderAdapterRegistry } from './providers/ai-provider-adapter.registry';
import { AiProviderConnectionService } from './providers/ai-provider-connection.service';
import { AiProviderSecretStore } from './providers/ai-provider-secret.store';
import { AI_PROVIDER_FETCH } from './providers/ai-provider.types';
import { OpenAiAdapter } from './providers/openai.adapter';
import { AiAdminExternalAgentAccessController } from './admin/ai-admin-external-agent-access.controller';
import { AiAdminExternalAgentsController } from './admin/ai-admin-external-agents.controller';
import { AiAdminInternalAgentAccessController } from './admin/ai-admin-internal-agent-access.controller';
import { AiAdminInternalAgentsController } from './admin/ai-admin-internal-agents.controller';
import { AiAdminModelsController } from './admin/ai-admin-models.controller';
import { AiAdminOverviewController } from './admin/ai-admin-overview.controller';
import { AiAdminPoliciesController } from './admin/ai-admin-policies.controller';
import { AiAdminProvidersController } from './admin/ai-admin-providers.controller';
import { AiAdminQueryService } from './admin/ai-admin-query.service';
import { AiAdminWorkspaceAccessController } from './admin/ai-admin-workspace-access.controller';
import { AgentArtifactsController } from './rest/agent-artifacts.controller';
import { AgentIdentityController } from './rest/agent-identity.controller';
import { AgentTasksController } from './rest/agent-tasks.controller';

/**
 * AI Platform foundation: External Agent protocols plus provider/model/Internal
 * Agent configuration. REST/MCP stay thin adapters over the capability gateway.
 * Provider keys never become a capability input.
 */
@Module({
  imports: [AuditModule, TasksModule, DriveModule],
  controllers: [
    AgentIdentityController,
    AgentTasksController,
    AgentArtifactsController,
    AgentMcpController,
    AiAdminOverviewController,
    AiAdminExternalAgentsController,
    AiAdminExternalAgentAccessController,
    AiAdminProvidersController,
    AiAdminModelsController,
    AiAdminPoliciesController,
    AiAdminInternalAgentsController,
    AiAdminInternalAgentAccessController,
    AiAdminWorkspaceAccessController,
  ],
  providers: [
    AiPlatformAuditService,
    ExternalAgentService,
    AgentCredentialService,
    AgentGrantService,
    AgentAuthenticatorService,
    AgentAuthGuard,
    AgentPolicyService,
    AgentIdempotencyService,
    AgentTaskAccess,
    AgentWorkspaceHandler,
    AgentTaskReadHandler,
    AgentTaskWriteHandler,
    AgentDriveHandler,
    AgentCapabilityGateway,
    AgentProtocolInvoker,
    AgentProtocolExceptionFilter,
    AgentCorrelationInterceptor,
    AgentMcpServer,
    { provide: AI_PROVIDER_FETCH, useValue: globalThis.fetch.bind(globalThis) },
    OpenAiAdapter,
    AnthropicAdapter,
    AiProviderAdapterRegistry,
    AiProviderSecretStore,
    AiProviderConnectionService,
    AiModelCatalogService,
    AiModelSyncService,
    AiModelPolicyService,
    AiModelPolicyResolver,
    InternalAgentService,
    InternalAgentGrantService,
    AiAdminQueryService,
  ],
  exports: [
    ExternalAgentService,
    AgentCredentialService,
    AgentGrantService,
    AgentAuthenticatorService,
    AgentAuthGuard,
    AgentPolicyService,
    AgentCapabilityGateway,
    AiProviderConnectionService,
    AiModelCatalogService,
    AiModelSyncService,
    AiModelPolicyService,
    InternalAgentService,
    InternalAgentGrantService,
  ],
})
export class AiPlatformModule implements OnModuleInit {
  constructor(
    private readonly audit: AuditService,
    private readonly agents: ExternalAgentService,
    private readonly internalAgents: InternalAgentService,
  ) {}

  /** Lets Audit render External and Internal Agent names without importing this module. */
  async onModuleInit(): Promise<void> {
    this.audit.registerActorLookups({
      resolveExternalAgentDisplayNames: (ids) => this.agents.resolveDisplayNames(ids),
      resolveInternalAiDisplayNames: (ids) => this.internalAgents.resolveDisplayNames(ids),
    });
    await primeAgentSecretVerifier();
  }
}
