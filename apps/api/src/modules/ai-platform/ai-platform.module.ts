import { Module, type OnModuleInit } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuditService } from '../audit/audit.service';
import { ExternalAgentService } from './agents/external-agent.service';
import { AiPlatformAuditService } from './ai-platform-audit.service';
import { AgentAuthGuard } from './auth/agent-auth.guard';
import { AgentAuthenticatorService } from './auth/agent-authenticator.service';
import { AgentCredentialService } from './credentials/agent-credential.service';
import { primeAgentSecretVerifier } from './credentials/agent-secret-hash';
import { AgentGrantService } from './grants/agent-grant.service';
import { AgentPolicyService } from './policy/agent-policy.service';

/**
 * AI Platform foundation: External Agent identity, credentials, capability
 * grants, resource scopes and the shared policy evaluator.
 *
 * REST and MCP protocol adapters land in Chat 4 and must consume these services
 * rather than adding a parallel permission system.
 */
@Module({
  imports: [AuditModule],
  providers: [
    AiPlatformAuditService,
    ExternalAgentService,
    AgentCredentialService,
    AgentGrantService,
    AgentAuthenticatorService,
    AgentAuthGuard,
    AgentPolicyService,
  ],
  exports: [
    ExternalAgentService,
    AgentCredentialService,
    AgentGrantService,
    AgentAuthenticatorService,
    AgentAuthGuard,
    AgentPolicyService,
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
    // Warm the decoy verifier so the first unknown key id is not measurably cheaper.
    await primeAgentSecretVerifier();
  }
}
