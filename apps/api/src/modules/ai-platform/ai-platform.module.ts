import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AiPlatformCoreModule } from './ai-platform-core.module';
import { AiAdminExternalAgentAccessController } from './admin/ai-admin-external-agent-access.controller';
import { AiAdminExternalAgentsController } from './admin/ai-admin-external-agents.controller';
import { AiAdminInternalAgentAccessController } from './admin/ai-admin-internal-agent-access.controller';
import { AiAdminInternalAgentsController } from './admin/ai-admin-internal-agents.controller';
import { AiAdminModelsController } from './admin/ai-admin-models.controller';
import { AiAdminOverviewController } from './admin/ai-admin-overview.controller';
import { AiAdminPoliciesController } from './admin/ai-admin-policies.controller';
import { AiAdminPromptPoliciesController } from './admin/ai-admin-prompt-policies.controller';
import { AiAdminApprovalsController } from './admin/ai-admin-approvals.controller';
import { AiAdminUsageController } from './admin/ai-admin-usage.controller';
import { AiAdminEvaluationController } from './admin/ai-admin-evaluation.controller';
import { AiAdminProvidersController } from './admin/ai-admin-providers.controller';
import { AiAdminWorkspaceAccessController } from './admin/ai-admin-workspace-access.controller';
import { AgentMcpController } from './mcp/agent-mcp.controller';
import { AgentArtifactsController } from './rest/agent-artifacts.controller';
import { AgentIdentityController } from './rest/agent-identity.controller';
import { AgentTasksController } from './rest/agent-tasks.controller';

/**
 * AI Platform HTTP surface: External Agent protocols plus the employee admin
 * namespace. REST/MCP stay thin adapters over the capability gateway held by
 * `AiPlatformCoreModule`. Provider keys never become a capability input.
 */
@Module({
  imports: [AiPlatformCoreModule, AuditModule],
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
    AiAdminPromptPoliciesController,
    AiAdminApprovalsController,
    AiAdminUsageController,
    AiAdminEvaluationController,
    AiAdminInternalAgentsController,
    AiAdminInternalAgentAccessController,
    AiAdminWorkspaceAccessController,
  ],
  exports: [AiPlatformCoreModule],
})
export class AiPlatformModule {}
