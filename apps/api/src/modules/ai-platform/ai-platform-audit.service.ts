import { Injectable } from '@nestjs/common';
import type { InputJsonValue } from '@nbos/database';
import { actorContextFromEmployee, type ActorContext } from '@nbos/shared';
import { AuditService, type AuditWriteClient } from '../audit/audit.service';

export interface AiAdminAuditParams {
  entityType: string;
  entityId: string;
  action: string;
  actingEmployeeId: string;
  changes?: InputJsonValue;
}

export interface AiMachineAuditParams {
  entityType: string;
  entityId: string;
  action: string;
  actor: ActorContext;
  changes?: InputJsonValue;
}

/**
 * Single audit entry point for the AI Platform.
 *
 * Human administration writes an employee actor (so legacy `userId` stays
 * populated), machine activity writes the machine ActorContext and never a
 * `userId`. Raw tokens and secrets are never passed in `changes`.
 *
 * Every method accepts an optional transaction client. Security-relevant
 * mutations pass their own transaction so a state change and its audit row
 * commit together — an un-audited active grant or credential is not a state the
 * platform is allowed to reach.
 */
@Injectable()
export class AiPlatformAuditService {
  constructor(private readonly audit: AuditService) {}

  async logAdminAction(params: AiAdminAuditParams, client?: AuditWriteClient): Promise<void> {
    await this.audit.log(
      {
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        actor: actorContextFromEmployee(
          { id: params.actingEmployeeId },
          { channel: { source: 'web' } },
        ),
        changes: params.changes,
      },
      client,
    );
  }

  async logMachineAction(params: AiMachineAuditParams, client?: AuditWriteClient): Promise<void> {
    await this.audit.log(
      {
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        actor: params.actor,
        changes: params.changes,
      },
      client,
    );
  }
}
