import { Module, type OnModuleInit } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuditService } from '../audit/audit.service';
import { DriveModule } from '../drive/drive.module';
import { TasksModule } from '../tasks/tasks.module';
import { ExternalAgentService } from './agents/external-agent.service';
import { AiPlatformAuditService } from './ai-platform-audit.service';
import { AgentAuthGuard } from './auth/agent-auth.guard';
import { AgentAuthenticatorService } from './auth/agent-authenticator.service';
import { AgentUsageInterceptor } from './auth/agent-usage.interceptor';
import { AgentCredentialService } from './credentials/agent-credential.service';
import { primeAgentSecretVerifier } from './credentials/agent-secret-hash';
import { AgentCapabilityGateway } from './gateway/agent-capability.gateway';
import { AgentDriveHandler } from './gateway/agent-drive.handler';
import { AgentIdempotencyService } from './gateway/agent-idempotency.service';
import { AgentReplayAuthorization } from './gateway/agent-replay-authorization';
import { AgentTaskAccess } from './gateway/agent-task-access';
import { AgentTaskReadHandler } from './gateway/agent-task-read.handler';
import { AgentTaskWriteHandler } from './gateway/agent-task-write.handler';
import { AgentWorkspaceHandler } from './gateway/agent-workspace.handler';
import { AgentGrantService } from './grants/agent-grant.service';
import { InternalAgentGrantService } from './internal-agents/internal-agent-grant.service';
import { InternalAgentService } from './internal-agents/internal-agent.service';
import { AgentPreAuthThrottleService } from './limits/agent-preauth-throttle.service';
import { AgentPreAuthGuard } from './limits/agent-preauth.guard';
import { AgentRateLimitGuard } from './limits/agent-rate-limit.guard';
import { AgentRateLimitService } from './limits/agent-rate-limit.service';
import { AgentMcpServer } from './mcp/agent-mcp.server';
import { AiModelCatalogService } from './models/ai-model-catalog.service';
import { AiModelSyncService } from './models/ai-model-sync.service';
import { AiContextAssemblerService } from './context/ai-context-assembler.service';
import { AiKnowledgeService } from './context/ai-knowledge.service';
import { AiPersistentMemoryService } from './context/ai-persistent-memory.service';
import { AiModelPolicyResolver } from './policies/ai-model-policy.resolver';
import { AiModelPolicyService } from './policies/ai-model-policy.service';
import { AiPromptPolicyService } from './prompts/ai-prompt-policy.service';
import { AiApprovalRequestService } from './approvals/ai-approval-request.service';
import { AgentPolicyService } from './policy/agent-policy.service';
import { AgentCorrelationInterceptor } from './protocol/agent-correlation.interceptor';
import { AgentProtocolExceptionFilter } from './protocol/agent-protocol.filter';
import { AgentProtocolInvoker } from './protocol/agent-protocol.invoker';
import { AiProviderAdapterRegistry } from './providers/ai-provider-adapter.registry';
import { AiProviderConnectionService } from './providers/ai-provider-connection.service';
import { AiProviderSecretStore } from './providers/ai-provider-secret.store';
import { AI_PROVIDER_FETCH } from './providers/ai-provider.types';
import { AnthropicAdapter } from './providers/anthropic.adapter';
import { OpenAiAdapter } from './providers/openai.adapter';
import { AiAdminQueryService } from './admin/ai-admin-query.service';

/**
 * AI Platform services with no HTTP surface of their own.
 *
 * Split out from `AiPlatformModule` so a process that only needs a service —
 * the scheduler needs `AiModelSyncService` for the catalog cron — can import
 * the behaviour without also mounting the External Agent REST/MCP namespace and
 * the employee admin controllers on that process.
 */
@Module({
  imports: [AuditModule, TasksModule, DriveModule],
  providers: [
    AiPlatformAuditService,
    ExternalAgentService,
    AgentCredentialService,
    AgentGrantService,
    AgentAuthenticatorService,
    AgentAuthGuard,
    AgentUsageInterceptor,
    AgentPreAuthThrottleService,
    AgentPreAuthGuard,
    AgentRateLimitService,
    AgentRateLimitGuard,
    AgentPolicyService,
    AgentIdempotencyService,
    AgentReplayAuthorization,
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
    AiPromptPolicyService,
    AiApprovalRequestService,
    AiContextAssemblerService,
    AiPersistentMemoryService,
    AiKnowledgeService,
    InternalAgentService,
    InternalAgentGrantService,
    AiAdminQueryService,
  ],
  exports: [
    AiPlatformAuditService,
    ExternalAgentService,
    AgentCredentialService,
    AgentGrantService,
    AgentAuthenticatorService,
    AgentAuthGuard,
    AgentUsageInterceptor,
    AgentPreAuthThrottleService,
    AgentPreAuthGuard,
    AgentRateLimitService,
    AgentRateLimitGuard,
    AgentPolicyService,
    AgentCapabilityGateway,
    AgentProtocolInvoker,
    AgentProtocolExceptionFilter,
    AgentCorrelationInterceptor,
    AgentMcpServer,
    AiProviderConnectionService,
    AiModelCatalogService,
    AiModelSyncService,
    AiModelPolicyService,
    AiPromptPolicyService,
    AiApprovalRequestService,
    AiContextAssemblerService,
    AiPersistentMemoryService,
    AiKnowledgeService,
    InternalAgentService,
    InternalAgentGrantService,
    AiAdminQueryService,
  ],
})
export class AiPlatformCoreModule implements OnModuleInit {
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
