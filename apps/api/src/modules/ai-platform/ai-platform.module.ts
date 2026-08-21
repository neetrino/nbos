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
import { AgentPolicyService } from './policy/agent-policy.service';

/**
 * AI Platform foundation: External Agent identity, credentials, policy and the
 * Domain Action Gateway. REST and MCP adapters (Chat 4) must call the gateway
 * rather than Tasks/Drive Prisma or a second permission system.
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
    AgentPolicyService,
    AgentIdempotencyService,
    AgentTaskAccess,
    AgentWorkspaceHandler,
    AgentTaskReadHandler,
    AgentTaskWriteHandler,
    AgentDriveHandler,
    AgentCapabilityGateway,
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
