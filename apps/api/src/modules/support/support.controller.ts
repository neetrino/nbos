import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CurrentUser, type CurrentUserPayload } from '../../common/decorators';
import { SupportService } from './support.service';

@ApiTags('Support')
@ApiBearerAuth()
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get()
  @ApiOperation({ summary: 'Get all support tickets with filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'coverageDecision', required: false })
  @ApiQuery({ name: 'assignedTo', required: false })
  @ApiQuery({ name: 'waitingState', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('projectId') projectId?: string,
    @Query('productId') productId?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('category') category?: string,
    @Query('coverageDecision') coverageDecision?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('waitingState') waitingState?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.supportService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      projectId,
      productId,
      status,
      priority,
      category,
      coverageDecision,
      assignedTo,
      waitingState,
      search,
      sortBy,
      sortOrder,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get support ticket statistics' })
  async getStats() {
    return this.supportService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get support ticket by ID' })
  async findOne(@Param('id') id: string) {
    return this.supportService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create support ticket' })
  async create(
    @Body()
    body: {
      title: string;
      projectId: string;
      category: string;
      description?: string;
      productId?: string;
      coverageDecision?: string | null;
      contactId?: string;
      priority?: string;
      billable?: boolean;
      assignedTo?: string;
      technicalAssetId?: string | null;
      technicalEnvironmentId?: string | null;
    },
  ) {
    return this.supportService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update support ticket' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      projectId?: string;
      productId?: string | null;
      contactId?: string;
      category?: string;
      coverageDecision?: string | null;
      priority?: string;
      billable?: boolean;
      assignedTo?: string;
      technicalAssetId?: string | null;
      technicalEnvironmentId?: string | null;
    },
  ) {
    return this.supportService.update(id, body);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update support ticket status' })
  async updateStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.supportService.updateStatus(id, status, user.id);
  }

  @Post(':id/actions/reopen')
  @ApiOperation({
    summary:
      'Reopen resolved/closed ticket as transition event (status -> IN_PROGRESS, not REOPENED)',
  })
  async reopenTicket(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.supportService.reopen(id, user.id, body.reason);
  }

  @Patch(':id/waiting')
  @ApiOperation({ summary: 'Set waiting overlay (SLA pause when not NONE)' })
  async updateWaiting(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: { waitingState: string; waitingReason?: string | null },
  ) {
    return this.supportService.updateWaitingState(id, body, user.id);
  }

  @Post(':id/actions/escalate')
  @ApiOperation({ summary: 'Managerial escalation (overlay + in-app notify)' })
  async escalate(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.supportService.recordManagerialEscalation(id, user.id, body.reason);
  }

  @Post(':id/actions/create-task')
  @ApiOperation({ summary: 'Create linked execution task for support ticket' })
  async createExecutionTask(
    @Param('id') id: string,
    @Body()
    body: {
      creatorId: string;
      title?: string;
      description?: string;
      dueDate?: string | null;
    },
  ) {
    return this.supportService.createExecutionTask(id, body);
  }

  @Post(':id/actions/create-extension-deal')
  @ApiOperation({ summary: 'Create linked Extension Deal for change request ticket' })
  async createExtensionDeal(
    @Param('id') id: string,
    @Body()
    body: {
      sellerId: string;
      contactId?: string;
      amount?: number;
      paymentType?: string;
      name?: string;
      notes?: string;
    },
  ) {
    return this.supportService.createExtensionDeal(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete support ticket' })
  async remove(@Param('id') id: string) {
    await this.supportService.delete(id);
  }
}
