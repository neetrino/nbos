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
import { AgentMcpController } from './mcp/agent-mcp.controller';
import { AgentMcpServer } from './mcp/agent-mcp.server';
import { AgentPolicyService } from './policy/agent-policy.service';
import { AgentCorrelationInterceptor } from './protocol/agent-correlation.interceptor';
import { AgentProtocolExceptionFilter } from './protocol/agent-protocol.filter';
import { AgentProtocolInvoker } from './protocol/agent-protocol.invoker';
import { AgentArtifactsController } from './rest/agent-artifacts.controller';
import { AgentIdentityController } from './rest/agent-identity.controller';
import { AgentTasksController } from './rest/agent-tasks.controller';

/**
 * AI Platform foundation: External Agent identity, credentials, policy, the
 * Domain Action Gateway and the two protocol adapters.
 *
 * The REST controllers and the MCP server are thin: they resolve a transport
 * request to an operation and call `AgentCapabilityGateway` through
 * `AgentProtocolInvoker`. They never reach Prisma, Tasks or Drive directly and
 * never evaluate policy themselves.
 */
@Module({
  imports: [AuditModule, TasksModule, DriveModule],
  controllers: [
    AgentIdentityController,
    AgentTasksController,
    AgentArtifactsController,
    AgentMcpController,
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
  ],
  exports: [
    ExternalAgentService,
    AgentCredentialService,
    AgentGrantService,
    AgentAuthenticatorService,
    AgentAuthGuard,
    AgentPolicyService,
    AgentCapabilityGateway,
  ],
})
export class AiPlatformModule implements OnModuleInit {
  constructor(
    private readonly audit: AuditService,
    private readonly agents: ExternalAgentService,
  ) {}

  /** Lets Audit render External Agent names without importing this module. */
  async onModuleInit(): Promise<void> {
    this.audit.registerActorLookups({
      resolveExternalAgentDisplayNames: (ids) => this.agents.resolveDisplayNames(ids),
    });
    await primeAgentSecretVerifier();
  }
}
