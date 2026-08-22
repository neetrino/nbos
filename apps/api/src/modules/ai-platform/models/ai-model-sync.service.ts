import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import type { AiModelStatus, AiProviderType } from '@nbos/shared';
import { PRISMA_TOKEN } from '../../../database.module';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { AI_AUDIT_ACTION, AI_AUDIT_ENTITY } from '../ai-platform.constants';
import type { PrismaTransaction } from '../agents/agent-row-lock';
import { AiProviderAdapterRegistry } from '../providers/ai-provider-adapter.registry';
import { AiProviderConnectionService } from '../providers/ai-provider-connection.service';
import type { DiscoveredProviderModel } from '../providers/ai-provider.types';
import { catalogSyncSystemActor } from './ai-model-catalog.contract';
import { toAiModelView } from './ai-model.mapper';
import {
  AI_MODEL_STATUS_ON_DISCOVERY,
  isUnchangedOnRefresh,
  planModelSync,
  statusAfterDisappear,
  statusAfterRefresh,
} from './ai-model-sync.rules';
import {
  assertSyncOwnership,
  assertSyncOwnershipInTransaction,
  toModelSyncErrorCode,
  type ModelSyncActor,
  type ModelSyncConnectionOutcome,
  type ModelSyncOwnership,
  type ModelSyncResult,
} from './ai-model-sync.types';

export type {
  ModelSyncConnectionOutcome,
  ModelSyncOwnership,
  ModelSyncResult,
} from './ai-model-sync.types';

@Injectable()
export class AiModelSyncService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly connections: AiProviderConnectionService,
    private readonly adapters: AiProviderAdapterRegistry,
    private readonly audit: AiPlatformAuditService,
  ) {}

  async syncConnection(connectionId: string, actingEmployeeId: string): Promise<ModelSyncResult> {
    return this.syncConnectionAs(connectionId, { kind: 'employee', employeeId: actingEmployeeId });
  }

  /**
   * SYSTEM scheduled runner. Continues after a single connection failure and
   * writes machine audit without a synthetic Employee.
   *
   * `ownership` is the scheduler lease. Its signal is checked before every
   * connection and again after the provider call, and its `stillOwned` probe
   * runs inside the write transaction, so a run that lost the lease cannot
   * commit beside its successor even if the loss happened mid-transaction.
   */
  async runScheduledCatalogSync(
    ownership?: ModelSyncOwnership,
  ): Promise<ModelSyncConnectionOutcome[]> {
    return this.syncEnabledConnections({ kind: 'system' }, ownership);
  }

  async syncAllEnabledConnections(actingEmployeeId: string): Promise<ModelSyncConnectionOutcome[]> {
    return this.syncEnabledConnections({ kind: 'employee', employeeId: actingEmployeeId });
  }

  private async syncEnabledConnections(
    actor: ModelSyncActor,
    ownership?: ModelSyncOwnership,
  ): Promise<ModelSyncConnectionOutcome[]> {
    const connections = await this.connections.listAll();
    const outcomes: ModelSyncConnectionOutcome[] = [];
    for (const connection of connections) {
      if (ownership?.signal?.aborted) break;
      if (connection.status !== 'ACTIVE') {
        continue;
      }
      outcomes.push(await this.syncOneEnabled(connection.id, actor, ownership));
    }
    return outcomes;
  }

  private async syncOneEnabled(
    connectionId: string,
    actor: ModelSyncActor,
    ownership?: ModelSyncOwnership,
  ): Promise<ModelSyncConnectionOutcome> {
    try {
      const result = await this.syncConnectionAs(connectionId, actor, ownership);
      return { connectionId, ok: true, result };
    } catch (error: unknown) {
      return { connectionId, ok: false, errorCode: toModelSyncErrorCode(error) };
    }
  }

  private async syncConnectionAs(
    connectionId: string,
    actor: ModelSyncActor,
    ownership?: ModelSyncOwnership,
  ): Promise<ModelSyncResult> {
    const { connection, credentials } = await this.connections.credentialsForActive(connectionId);
    const discovered = await this.adapters.get(connection.provider).listModels(credentials);
    assertSyncOwnership(ownership?.signal);
    return this.applySync(connectionId, connection.provider, discovered, actor, ownership);
  }

  private async applySync(
    connectionId: string,
    provider: AiProviderType,
    discovered: DiscoveredProviderModel[],
    actor: ModelSyncActor,
    ownership?: ModelSyncOwnership,
  ): Promise<ModelSyncResult> {
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      // First statement of the transaction: it locks the lease row, so the run
      // either owns the job for the whole commit or writes nothing at all.
      await assertSyncOwnershipInTransaction(tx, ownership);
      const existing = await tx.aiModel.findMany({
        where: { connectionId },
        select: {
          id: true,
          providerModelId: true,
          status: true,
          displayName: true,
          providerMetadata: true,
          aliasOf: true,
          snapshotId: true,
        },
      });
      const plan = planModelSync(existing, discovered);
      await this.insertDiscovered(tx, connectionId, provider, plan.create, now);
      await this.refreshSeen(tx, plan.refresh, now);
      await this.markDisappeared(tx, plan.disappear);
      await this.connections.markModelSync(connectionId, now, tx);
      await this.writeSyncAudit(tx, connectionId, actor, {
        created: plan.create.length,
        refreshed: plan.refresh.length,
        disappeared: plan.disappear.length,
      });
      const models = await tx.aiModel.findMany({
        where: { connectionId },
        orderBy: { providerModelId: 'asc' },
      });
      return {
        connectionId,
        created: plan.create.length,
        refreshed: plan.refresh.length,
        disappeared: plan.disappear.length,
        models: models.map((row) => toAiModelView(row)),
      };
    });
  }

  private async writeSyncAudit(
    tx: PrismaTransaction,
    connectionId: string,
    actor: ModelSyncActor,
    changes: { created: number; refreshed: number; disappeared: number },
  ): Promise<void> {
    if (actor.kind === 'employee') {
      await this.audit.logAdminAction(
        {
          entityType: AI_AUDIT_ENTITY.providerConnection,
          entityId: connectionId,
          action: AI_AUDIT_ACTION.modelsSynced,
          actingEmployeeId: actor.employeeId,
          changes,
        },
        tx,
      );
      return;
    }
    await this.audit.logMachineAction(
      {
        entityType: AI_AUDIT_ENTITY.providerConnection,
        entityId: connectionId,
        action: AI_AUDIT_ACTION.modelsSynced,
        actor: catalogSyncSystemActor(),
        changes,
      },
      tx,
    );
  }

  private async insertDiscovered(
    tx: PrismaTransaction,
    connectionId: string,
    provider: AiProviderType,
    created: DiscoveredProviderModel[],
    now: Date,
  ): Promise<void> {
    if (created.length === 0) {
      return;
    }
    await tx.aiModel.createMany({
      data: created.map((model) => ({
        connectionId,
        provider,
        providerModelId: model.providerModelId,
        displayName: model.displayName,
        status: AI_MODEL_STATUS_ON_DISCOVERY,
        discoveredAt: now,
        lastSeenAt: now,
        providerMetadata: model.providerMetadata as InputJsonValue,
        suitabilityTags: [],
        aliasOf: model.aliasOf,
        snapshotId: model.snapshotId,
      })),
    });
  }

  private async refreshSeen(
    tx: PrismaTransaction,
    refresh: ReturnType<typeof planModelSync>['refresh'],
    now: Date,
  ): Promise<void> {
    const unchanged = refresh.filter((item) =>
      isUnchangedOnRefresh(item.existing, item.discovered),
    );
    const changed = refresh.filter((item) => !isUnchangedOnRefresh(item.existing, item.discovered));

    if (unchanged.length > 0) {
      await tx.aiModel.updateMany({
        where: { id: { in: unchanged.map((item) => item.existing.id) } },
        data: { lastSeenAt: now },
      });
    }
    for (const item of changed) {
      await tx.aiModel.update({
        where: { id: item.existing.id },
        data: {
          displayName: item.discovered.displayName,
          lastSeenAt: now,
          providerMetadata: item.discovered.providerMetadata as InputJsonValue,
          aliasOf: item.discovered.aliasOf,
          snapshotId: item.discovered.snapshotId,
          status: statusAfterRefresh(item.existing.status),
        },
      });
    }
  }

  private async markDisappeared(
    tx: PrismaTransaction,
    disappeared: ReturnType<typeof planModelSync>['disappear'],
  ): Promise<void> {
    const byNextStatus = new Map<AiModelStatus, string[]>();
    for (const item of disappeared) {
      const next = statusAfterDisappear(item.status);
      if (next === item.status) {
        continue;
      }
      byNextStatus.set(next, [...(byNextStatus.get(next) ?? []), item.id]);
    }
    for (const [status, ids] of byNextStatus) {
      await tx.aiModel.updateMany({ where: { id: { in: ids } }, data: { status } });
    }
  }
}
