import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import type { CurrentUserPayload } from '../../../common/decorators';
import { AuditService } from '../../audit/audit.service';
import { AtsCallbackClient } from '../../integrations/ats/ats-callback.client';
import { AtsCallRealtimePublisher } from '../../integrations/ats/ats-call-realtime.publisher';
import { mapCallResponse, type CallResponse } from './call-response.map';
import { callAccessActorFromUser } from './call-access.types';
import {
  CALL_AUDIT_ENTITY_TYPE,
  CALL_INITIATED_AUDIT_ACTION,
  CLICK_TO_CALL_ATS_FAILED_MESSAGE,
  CLICK_TO_CALL_MISSING_SIP_MESSAGE,
} from './click-to-call.constants';
import {
  ATS_CALL_INTENT_ERROR_ATS_NOT_CONFIGURED,
  ATS_CALL_INTENT_ERROR_ATS_REJECTED,
  CLICK_TO_CALL_ATS_NOT_CONFIGURED_MESSAGE,
  clickToCallFingerprint,
  requireClickToCallIdempotencyKey,
} from './click-to-call-idempotency';
import { ClickToCallInProgressException } from './click-to-call-exceptions';
import { ATS_CALL_INTENT_STATUS } from './click-to-call-intent.constants';
import {
  claimClickToCallIntent,
  ensureClickToCallIntent,
  loadClickToCallIntent,
  type ClickToCallIntentRow,
} from './click-to-call-intent.store';
import {
  acceptClickToCallIntent,
  failClickToCallIntent,
  loadAcceptedCall,
} from './click-to-call-intent.write';
import { ClickToCallTargetLoader } from './click-to-call-target';
import type { StartClickToCallDto } from './dto/start-click-to-call.dto';
import type { LoadedClickToCallTarget } from './click-to-call-target';

@Injectable()
export class ClickToCallService {
  private readonly logger = new Logger(ClickToCallService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly targets: ClickToCallTargetLoader,
    private readonly callback: AtsCallbackClient,
    private readonly audit: AuditService,
    private readonly realtime: AtsCallRealtimePublisher,
  ) {}

  async start(
    dto: StartClickToCallDto,
    user: CurrentUserPayload,
    idempotencyKey: string | undefined,
  ): Promise<CallResponse> {
    const target = await this.targets.load(
      dto.targetType,
      dto.targetId,
      callAccessActorFromUser(user),
    );
    const key = requireClickToCallIdempotencyKey(idempotencyKey);
    const from = await this.loadSipExtension(user.id);
    const fingerprint = clickToCallFingerprint({
      employeeId: user.id,
      targetType: dto.targetType,
      targetId: dto.targetId,
    });
    const intent = await ensureClickToCallIntent(this.prisma, {
      employeeId: user.id,
      idempotencyKey: key,
      fingerprint,
      targetType: dto.targetType,
      targetId: dto.targetId,
    });
    return this.fulfill(intent, { from, target, dto, user, key });
  }

  private async fulfill(
    intent: ClickToCallIntentRow,
    ctx: {
      from: string;
      target: LoadedClickToCallTarget;
      dto: StartClickToCallDto;
      user: CurrentUserPayload;
      key: string;
    },
  ): Promise<CallResponse> {
    if (intent.status === ATS_CALL_INTENT_STATUS.ACCEPTED) {
      return this.returnAccepted(intent);
    }
    if (intent.status === ATS_CALL_INTENT_STATUS.FAILED) {
      this.throwForFailedIntent(intent);
    }
    if (intent.status === ATS_CALL_INTENT_STATUS.PROCESSING) {
      throw new ClickToCallInProgressException();
    }
    const claimed = await claimClickToCallIntent(this.prisma, intent.id);
    if (!claimed) {
      return this.replayAfterLostClaim(ctx);
    }
    return this.executeClaimed(intent, ctx);
  }

  private async replayAfterLostClaim(ctx: {
    from: string;
    target: LoadedClickToCallTarget;
    dto: StartClickToCallDto;
    user: CurrentUserPayload;
    key: string;
  }): Promise<CallResponse> {
    const latest = await loadClickToCallIntent(this.prisma, {
      employeeId: ctx.user.id,
      idempotencyKey: ctx.key,
    });
    if (!latest || latest.status === ATS_CALL_INTENT_STATUS.PENDING) {
      throw new ClickToCallInProgressException();
    }
    if (latest.status === ATS_CALL_INTENT_STATUS.ACCEPTED) {
      return this.returnAccepted(latest);
    }
    if (latest.status === ATS_CALL_INTENT_STATUS.FAILED) {
      this.throwForFailedIntent(latest);
    }
    throw new ClickToCallInProgressException();
  }

  private async executeClaimed(
    intent: ClickToCallIntentRow,
    ctx: {
      from: string;
      target: LoadedClickToCallTarget;
      dto: StartClickToCallDto;
      user: CurrentUserPayload;
    },
  ): Promise<CallResponse> {
    const result = await this.callback.startCallbackCall({ from: ctx.from, to: ctx.target.to });
    if (result.kind === 'unknown') {
      throw new ClickToCallInProgressException();
    }
    if (result.kind === 'unconfigured') {
      await failClickToCallIntent(this.prisma, intent.id, ATS_CALL_INTENT_ERROR_ATS_NOT_CONFIGURED);
      throw new ServiceUnavailableException(CLICK_TO_CALL_ATS_NOT_CONFIGURED_MESSAGE);
    }
    if (result.kind !== 'accepted') {
      await failClickToCallIntent(this.prisma, intent.id, ATS_CALL_INTENT_ERROR_ATS_REJECTED);
      throw new BadGatewayException(CLICK_TO_CALL_ATS_FAILED_MESSAGE);
    }
    const row = await acceptClickToCallIntent(this.prisma, {
      intent,
      target: ctx.target,
      employeeId: ctx.user.id,
    });
    await this.afterStart(row.id, ctx.dto, ctx.user.id);
    return mapCallResponse(row);
  }

  private async returnAccepted(intent: ClickToCallIntentRow): Promise<CallResponse> {
    if (!intent.callId) {
      throw new ClickToCallInProgressException();
    }
    const row = await loadAcceptedCall(this.prisma, intent.callId);
    if (!row) {
      throw new ClickToCallInProgressException();
    }
    return mapCallResponse(row);
  }

  private async afterStart(
    callId: string,
    dto: StartClickToCallDto,
    userId: string,
  ): Promise<void> {
    try {
      await this.realtime.publishStartedToEmployee(callId, userId);
    } catch (err) {
      this.logger.error({ event: 'click_to_call_sse_failed', callId, error: String(err) });
    }
    try {
      await this.audit.log({
        entityType: CALL_AUDIT_ENTITY_TYPE,
        entityId: callId,
        action: CALL_INITIATED_AUDIT_ACTION,
        userId,
        changes: { targetType: dto.targetType, targetId: dto.targetId, userId },
      });
    } catch (err) {
      this.logger.error({ event: 'click_to_call_audit_failed', callId, error: String(err) });
    }
  }

  private throwForFailedIntent(intent: ClickToCallIntentRow): never {
    if (intent.errorCode === ATS_CALL_INTENT_ERROR_ATS_NOT_CONFIGURED) {
      throw new ServiceUnavailableException(CLICK_TO_CALL_ATS_NOT_CONFIGURED_MESSAGE);
    }
    throw new BadGatewayException(CLICK_TO_CALL_ATS_FAILED_MESSAGE);
  }

  private async loadSipExtension(employeeId: string): Promise<string> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { sipId: true },
    });
    const sipId = employee?.sipId?.trim() ?? '';
    if (!sipId) {
      throw new BadRequestException(CLICK_TO_CALL_MISSING_SIP_MESSAGE);
    }
    return sipId;
  }
}
