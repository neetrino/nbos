import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type CurrentUserPayload,
  RequirePermission,
} from '../../../common/decorators';
import { AiApprovalRequestService } from '../approvals/ai-approval-request.service';
import {
  AI_ADMIN_PERMISSION_ACTION,
  AI_ADMIN_PERMISSION_MODULE,
  AI_ADMIN_ROUTE_PREFIX,
} from './ai-admin.constants';
import { DecideApprovalDto } from './dto/decide-approval.dto';

@ApiTags('AI Admin')
@ApiBearerAuth()
@RequirePermission(AI_ADMIN_PERMISSION_MODULE, AI_ADMIN_PERMISSION_ACTION)
@Controller(`${AI_ADMIN_ROUTE_PREFIX}/approvals`)
export class AiAdminApprovalsController {
  constructor(private readonly approvals: AiApprovalRequestService) {}

  @Get()
  @ApiOperation({ summary: 'List pending AI approval requests' })
  listPending() {
    return this.approvals.listPending();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Approval request detail' })
  async getById(@Param('id') id: string) {
    const request = await this.approvals.findById(id);
    if (!request) {
      throw new NotFoundException('Approval request not found');
    }
    return request;
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a pending AI action' })
  approve(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: DecideApprovalDto,
  ) {
    return this.approvals.approve(id, user.id, body.reason);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a pending AI action' })
  reject(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: DecideApprovalDto,
  ) {
    return this.approvals.reject(id, user.id, body.reason);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a pending AI approval request' })
  cancel(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: DecideApprovalDto,
  ) {
    return this.approvals.cancel(id, user.id, body.reason);
  }
}
