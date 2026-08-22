import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IS_PUBLIC_KEY } from '../../../common/decorators';
import { authenticatedAgentFixture } from '../../../test-utils/authenticated-agent';
import { AgentAuthGuard } from '../auth/agent-auth.guard';
import { AgentAccessException } from '../auth/agent-auth.errors';
import type { AgentCapabilityGateway } from '../gateway/agent-capability.gateway';
import { AgentMcpController } from '../mcp/agent-mcp.controller';
import { AgentMcpServer } from '../mcp/agent-mcp.server';
import type { JsonRpcRequest } from '../mcp/agent-mcp.jsonrpc';
import { AgentRateLimitService } from '../limits/agent-rate-limit.service';
import { AgentArtifactsController } from '../rest/agent-artifacts.controller';
import { AgentIdentityController } from '../rest/agent-identity.controller';
import { AgentTasksController } from '../rest/agent-tasks.controller';
import { toAgentErrorResponse } from './agent-error.envelope';
import { listAgentOperations, type AgentOperationId } from './agent-operation.registry';
import { AgentProtocolInvoker } from './agent-protocol.invoker';

/** Nest stores controller guards under this reflection key. */
const GUARDS_METADATA = '__guards__';

const AGENT = authenticatedAgentFixture();
const CONTENT = Buffer.from('artifact').toString('base64');

interface ParityCase {
  operationId: AgentOperationId;
  rest: (controllers: Controllers) => Promise<unknown>;
  mcpTool: string;
  mcpArguments: Record<string, unknown>;
}

interface Controllers {
  identity: AgentIdentityController;
  tasks: AgentTasksController;
  artifacts: AgentArtifactsController;
}

/**
 * Equivalent REST and MCP calls for every published operation.
 *
 * Each pair must reach the gateway with the same capability, the same input and
 * the same idempotency key — that is what "REST and MCP must produce equivalent
 * authorization decisions" means in practice (`09` §13, §17).
 */
const PARITY_CASES: ParityCase[] = [
  {
    operationId: 'identity.read',
    rest: ({ identity }) => identity.me(AGENT),
    mcpTool: 'nbos_get_identity',
    mcpArguments: {},
  },
  {
    operationId: 'workspaces.list',
    rest: ({ identity }) => identity.listWorkspaces(AGENT, '2', '10'),
    mcpTool: 'nbos_list_workspaces',
    mcpArguments: { page: '2', pageSize: '10' },
  },
  {
    operationId: 'workspaces.get',
    rest: ({ identity }) => identity.getWorkspace(AGENT, 'ws-1'),
    mcpTool: 'nbos_get_workspace',
    mcpArguments: { workspaceId: 'ws-1' },
  },
  {
    operationId: 'tasks.list',
    rest: ({ tasks }) => tasks.listTasks(AGENT, 'ws-1', 'OPEN', 'updatedAt', '1', '20'),
    mcpTool: 'nbos_list_tasks',
    mcpArguments: {
      workspaceId: 'ws-1',
      status: 'OPEN',
      sortBy: 'updatedAt',
      page: '1',
      pageSize: '20',
    },
  },
  {
    operationId: 'tasks.get',
    rest: ({ tasks }) => tasks.getTask(AGENT, 'task-1'),
    mcpTool: 'nbos_get_task',
    mcpArguments: { taskId: 'task-1' },
  },
  {
    operationId: 'tasks.create',
    rest: ({ tasks }) => tasks.createTask(AGENT, 'ws-1', { title: 'T' }, 'op-1'),
    mcpTool: 'nbos_create_task',
    mcpArguments: { workspaceId: 'ws-1', title: 'T', clientOperationId: 'op-1' },
  },
  {
    operationId: 'tasks.update',
    rest: ({ tasks }) =>
      tasks.updateTask(AGENT, 'task-1', { title: 'T', expectedUpdatedAt: 'ts' }, 'op-1'),
    mcpTool: 'nbos_update_task',
    mcpArguments: {
      taskId: 'task-1',
      title: 'T',
      expectedUpdatedAt: 'ts',
      clientOperationId: 'op-1',
    },
  },
  {
    operationId: 'tasks.start',
    rest: ({ tasks }) => tasks.startTask(AGENT, 'task-1', {}, 'op-1'),
    mcpTool: 'nbos_start_task',
    mcpArguments: { taskId: 'task-1', clientOperationId: 'op-1' },
  },
  {
    operationId: 'tasks.discussion',
    rest: ({ tasks }) => tasks.getDiscussion(AGENT, 'task-1', '1', '20'),
    mcpTool: 'nbos_get_task_discussion',
    mcpArguments: { taskId: 'task-1', page: '1', pageSize: '20' },
  },
  {
    operationId: 'tasks.comment',
    rest: ({ tasks }) => tasks.addComment(AGENT, 'task-1', { body: 'note' }, 'op-1'),
    mcpTool: 'nbos_add_task_comment',
    mcpArguments: { taskId: 'task-1', body: 'note', clientOperationId: 'op-1' },
  },
  {
    operationId: 'tasks.submitReview',
    rest: ({ tasks }) => tasks.submitReview(AGENT, 'task-1', {}, 'op-1'),
    mcpTool: 'nbos_submit_task_review',
    mcpArguments: { taskId: 'task-1', clientOperationId: 'op-1' },
  },
  {
    operationId: 'artifacts.list',
    rest: ({ artifacts }) => artifacts.listArtifacts(AGENT, 'task-1'),
    mcpTool: 'nbos_list_task_artifacts',
    mcpArguments: { taskId: 'task-1' },
  },
  {
    operationId: 'artifacts.get',
    rest: ({ artifacts }) => artifacts.getArtifact(AGENT, 'task-1', 'file-1'),
    mcpTool: 'nbos_get_task_artifact',
    mcpArguments: { taskId: 'task-1', fileAssetId: 'file-1' },
  },
  {
    operationId: 'artifacts.attach',
    rest: ({ artifacts }) =>
      artifacts.attachArtifact(
        AGENT,
        'task-1',
        { fileName: 'a.txt', mimeType: 'text/plain', sizeBytes: 8, contentBase64: CONTENT },
        'op-1',
      ),
    mcpTool: 'nbos_attach_task_artifact',
    mcpArguments: {
      taskId: 'task-1',
      fileName: 'a.txt',
      mimeType: 'text/plain',
      sizeBytes: 8,
      contentBase64: CONTENT,
      clientOperationId: 'op-1',
    },
  },
];

/**
 * Cases that must reach `AgentCapabilityGateway.invoke`. `identity.read` is the
 * one published operation without a capability key, so it is asserted
 * separately rather than compared on a gateway call it never makes.
 */
const GATEWAY_CASES = PARITY_CASES.filter((testCase) => testCase.operationId !== 'identity.read');

function mcpRequest(tool: string, args: Record<string, unknown>): JsonRpcRequest {
  return { id: 1, method: 'tools/call', params: { name: tool, arguments: args } };
}

describe('REST and MCP protocol parity', () => {
  let gatewayInvoke: ReturnType<typeof vi.fn>;
  let controllers: Controllers;
  let mcp: AgentMcpServer;

  beforeEach(() => {
    gatewayInvoke = vi.fn().mockResolvedValue({ capabilityKey: 'x', data: { id: 'result-1' } });
    const invoker = new AgentProtocolInvoker(
      { invoke: gatewayInvoke } as unknown as AgentCapabilityGateway,
      new AgentRateLimitService(),
    );
    controllers = {
      identity: new AgentIdentityController(invoker),
      tasks: new AgentTasksController(invoker),
      artifacts: new AgentArtifactsController(invoker),
    };
    mcp = new AgentMcpServer(invoker);
  });

  it('covers every published operation', () => {
    const covered = PARITY_CASES.map((testCase) => testCase.operationId).sort();
    const published = listAgentOperations()
      .map((operation) => operation.id)
      .sort();

    expect(covered).toEqual(published);
  });

  it.each(GATEWAY_CASES)(
    '$operationId reaches the gateway identically over REST and MCP',
    async (testCase) => {
      await testCase.rest(controllers);
      const restCall = gatewayInvoke.mock.calls[0]?.[0];

      gatewayInvoke.mockClear();
      await mcp.handle(AGENT, mcpRequest(testCase.mcpTool, testCase.mcpArguments));
      const mcpCall = gatewayInvoke.mock.calls[0]?.[0];

      expect(restCall).toBeDefined();
      expect(mcpCall).toEqual(restCall);
    },
  );

  /**
   * `identity.read` carries no capability, so it never reaches the gateway and
   * has no deny path. Its parity claim is the projection itself.
   */
  it('answers identity from the same projection on both transports', async () => {
    const restBody = await controllers.identity.me(AGENT);

    const response = await mcp.handle(AGENT, mcpRequest('nbos_get_identity', {}));
    const result = (response as { result: Record<string, unknown> }).result;

    expect(result.structuredContent).toEqual(restBody);
    expect(result.isError).toBe(false);
    expect(gatewayInvoke).not.toHaveBeenCalled();
    expect(JSON.stringify(restBody)).not.toMatch(/capabilit|grant|secret|hash/i);
  });

  it.each(GATEWAY_CASES)(
    '$operationId reports the same deny code on both transports',
    async (testCase) => {
      const denial = AgentAccessException.fromDenyReason('CAPABILITY_NOT_GRANTED');
      gatewayInvoke.mockRejectedValue(denial);

      const restError = await testCase.rest(controllers).catch((error: unknown) => error);
      const restBody = toAgentErrorResponse(restError, 'corr-1').body;

      const response = await mcp.handle(AGENT, mcpRequest(testCase.mcpTool, testCase.mcpArguments));
      const result = (response as { result: Record<string, unknown> }).result;

      expect(result.isError).toBe(true);
      expect(result.structuredContent).toEqual(restBody);
    },
  );

  it.each([
    'RESOURCE_OUT_OF_SCOPE',
    'AGENT_DISABLED',
    'CREDENTIAL_REVOKED',
    'DATA_CLASSIFICATION_FORBIDDEN',
  ] as const)('reports %s the same way on both transports', async (reason) => {
    gatewayInvoke.mockRejectedValue(AgentAccessException.fromDenyReason(reason));

    const restError = await controllers.tasks.getTask(AGENT, 'task-1').catch((error) => error);
    const response = await mcp.handle(AGENT, mcpRequest('nbos_get_task', { taskId: 'task-1' }));
    const result = (response as { result: Record<string, unknown> }).result;

    expect(result.structuredContent).toEqual(toAgentErrorResponse(restError, 'corr-1').body);
  });

  it('requires the same idempotency binding from both transports', async () => {
    await controllers.tasks.createTask(AGENT, 'ws-1', { title: 'T' }, 'op-42');
    const restKey = gatewayInvoke.mock.calls[0][0].idempotencyKey;

    gatewayInvoke.mockClear();
    await mcp.handle(
      AGENT,
      mcpRequest('nbos_create_task', {
        workspaceId: 'ws-1',
        title: 'T',
        clientOperationId: 'op-42',
      }),
    );

    expect(gatewayInvoke.mock.calls[0][0].idempotencyKey).toBe(restKey);
    expect(restKey).toBe('op-42');
  });

  it('offers no delete path on either transport', () => {
    const restMethods = [
      ...Object.getOwnPropertyNames(AgentTasksController.prototype),
      ...Object.getOwnPropertyNames(AgentArtifactsController.prototype),
      ...Object.getOwnPropertyNames(AgentIdentityController.prototype),
    ].join(' ');

    expect(restMethods).not.toMatch(/delete|remove|destroy|complete/i);
    expect(PARITY_CASES.map((testCase) => testCase.mcpTool).join(' ')).not.toMatch(/delete/i);
  });

  it('authenticates every agent controller with the same guard and skips the employee chain', () => {
    const controllerClasses = [
      AgentIdentityController,
      AgentTasksController,
      AgentArtifactsController,
      AgentMcpController,
    ];

    for (const controllerClass of controllerClasses) {
      expect(Reflect.getMetadata(IS_PUBLIC_KEY, controllerClass)).toBe(true);
      expect(Reflect.getMetadata(GUARDS_METADATA, controllerClass)).toContain(AgentAuthGuard);
    }
  });
});
