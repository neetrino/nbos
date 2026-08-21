import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import type { CurrentUserPayload } from '../../../common/decorators';
import { AuditService } from '../../audit/audit.service';
import { AtsCallbackClient } from '../../integrations/ats/ats-callback.client';
import { AtsCallRealtimePublisher } from '../../integrations/ats/ats-call-realtime.publisher';
import { mapCallResponse, type CallResponse } from './call-response.map';
import { assertCanCreateCall } from './click-to-call-access';
import {
  CALL_AUDIT_ENTITY_TYPE,
  CALL_INITIATED_AUDIT_ACTION,
  CLICK_TO_CALL_ATS_FAILED_MESSAGE,
  CLICK_TO_CALL_MISSING_SIP_MESSAGE,
} from './click-to-call.constants';
import { persistClickToCallEvent } from './click-to-call-store';
import { ClickToCallTargetLoader } from './click-to-call-target';
import type { StartClickToCallDto } from './dto/start-click-to-call.dto';

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

  async start(dto: StartClickToCallDto, user: CurrentUserPayload): Promise<CallResponse> {
    const target = await this.targets.load(dto.targetType, dto.targetId);
    assertCanCreateCall(
      { id: user.id, permissions: user.permissions ?? {} },
      { parent: target.parent, assignedEmployeeIds: target.assignedEmployeeIds },
    );
    const from = await this.loadSipExtension(user.id);
    await this.startAtsCallback(from, target.to);
    const row = await persistClickToCallEvent(this.prisma, target, user.id);
    await this.afterStart(row.id, dto, user.id);
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
    await this.audit.log({
      entityType: CALL_AUDIT_ENTITY_TYPE,
      entityId: callId,
      action: CALL_INITIATED_AUDIT_ACTION,
      userId,
      changes: { targetType: dto.targetType, targetId: dto.targetId, userId },
    });
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

  private async startAtsCallback(from: string, to: string): Promise<void> {
    const result = await this.callback.startCallbackCall({ from, to });
    if (!result.success) {
      throw new BadGatewayException(CLICK_TO_CALL_ATS_FAILED_MESSAGE);
    }
  }
}
