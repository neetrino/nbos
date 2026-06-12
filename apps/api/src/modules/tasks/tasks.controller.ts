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
import { CurrentUser, type CurrentUserPayload, RequirePermission } from '../../common/decorators';
import { tasksAccessFromUser } from './tasks-scoped-access';
import { TasksService } from './tasks.service';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @RequirePermission('TASKS', 'VIEW')
  @ApiOperation({ summary: 'Get all tasks with filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'assigneeId', required: false })
  @ApiQuery({ name: 'creatorId', required: false })
  @ApiQuery({ name: 'workspaceId', required: false })
  @ApiQuery({ name: 'planningStatus', required: false })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'orderId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'involvesEmployeeId', required: false })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('creatorId') creatorId?: string,
    @Query('workspaceId') workspaceId?: string,
    @Query('planningStatus') planningStatus?: string,
    @Query('parentId') parentId?: string,
    @Query('hasParent') hasParent?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('projectId') projectId?: string,
    @Query('orderId') orderId?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('involvesEmployeeId') involvesEmployeeId?: string,
  ) {
    return this.tasksService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      status,
      priority,
      assigneeId,
      creatorId,
      workspaceId,
      planningStatus,
      parentId,
      hasParent: hasParent === 'false' ? false : undefined,
      entityType,
      entityId,
      projectId,
      orderId,
      search,
      sortBy,
      sortOrder,
      involvesEmployeeId,
      access: tasksAccessFromUser(user),
    });
  }

  @Get('stats')
  @RequirePermission('TASKS', 'VIEW')
  @ApiOperation({ summary: 'Get task statistics' })
  @ApiQuery({ name: 'involvesEmployeeId', required: false })
  async getStats(
    @CurrentUser() user: CurrentUserPayload,
    @Query('involvesEmployeeId') involvesEmployeeId?: string,
  ) {
    return this.tasksService.getStats(involvesEmployeeId, tasksAccessFromUser(user));
  }

  @Get('by-entity/:entityType/:entityId')
  @ApiOperation({ summary: 'Get tasks linked to an entity' })
  async findByEntity(@Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.tasksService.findByEntity(entityType, entityId);
  }

  @Patch('reorder')
  @RequirePermission('TASKS', 'EDIT')
  @ApiOperation({ summary: 'Reorder tasks within a board column' })
  async reorder(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { taskIds: string[]; scope: 'workspace' | 'my-plan' },
  ) {
    return this.tasksService.reorder(body.taskIds, body.scope, tasksAccessFromUser(user));
  }

  @Get(':id')
  @RequirePermission('TASKS', 'VIEW')
  @ApiOperation({ summary: 'Get task by ID' })
  async findOne(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.tasksService.findById(id, tasksAccessFromUser(user));
  }

  @Post()
  @ApiOperation({ summary: 'Create task' })
  async create(
    @Body()
    body: {
      title: string;
      creatorId: string;
      description?: string;
      assigneeId?: string;
      coAssignees?: string[];
      observers?: string[];
      priority?: string;
      workspaceId?: string;
      planningStatus?: string;
      completionRules?: unknown;
      dueDate?: string;
      parentId?: string;
      links?: Array<{ entityType: string; entityId: string }>;
    },
  ) {
    return this.tasksService.create(body);
  }

  @Put(':id')
  @RequirePermission('TASKS', 'EDIT')
  @ApiOperation({ summary: 'Update task' })
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      creatorId?: string;
      assigneeId?: string | null;
      coAssignees?: string[];
      observers?: string[];
      priority?: string;
      dueDate?: string | null;
      parentId?: string | null;
      myPlanStageId?: string | null;
      myPlanSortOrder?: number;
      workspaceId?: string | null;
      planningStatus?: string;
      workspaceSortOrder?: number;
      completionRules?: unknown;
    },
  ) {
    return this.tasksService.update(id, body, tasksAccessFromUser(user));
  }

  @Patch(':id/start')
  @RequirePermission('TASKS', 'EDIT')
  @ApiOperation({ summary: 'Start task' })
  async start(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.tasksService.start(id, tasksAccessFromUser(user));
  }

  @Patch(':id/complete')
  @RequirePermission('TASKS', 'EDIT')
  @ApiOperation({ summary: 'Complete task' })
  async complete(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.tasksService.complete(id, tasksAccessFromUser(user));
  }

  @Patch(':id/reopen')
  @RequirePermission('TASKS', 'EDIT')
  @ApiOperation({ summary: 'Reopen task' })
  async reopen(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.tasksService.reopen(id, tasksAccessFromUser(user));
  }

  @Patch(':id/on-hold')
  @RequirePermission('TASKS', 'EDIT')
  @ApiOperation({ summary: 'Set task status to On hold' })
  async setOnHold(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.tasksService.setOnHold(id, tasksAccessFromUser(user));
  }

  @Patch(':id/submit-review')
  @RequirePermission('TASKS', 'EDIT')
  @ApiOperation({ summary: 'Submit task for review' })
  async submitForReview(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: { reviewerId?: string },
  ) {
    return this.tasksService.submitForReview(id, body.reviewerId, tasksAccessFromUser(user));
  }

  @Patch(':id/approve-review')
  @RequirePermission('TASKS', 'EDIT')
  @ApiOperation({ summary: 'Approve task review' })
  async approveReview(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.tasksService.approveReview(id, tasksAccessFromUser(user));
  }

  @Patch(':id/request-review-changes')
  @RequirePermission('TASKS', 'EDIT')
  @ApiOperation({ summary: 'Return task from review to in progress' })
  async requestReviewChanges(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.tasksService.requestReviewChanges(id, tasksAccessFromUser(user));
  }

  @Delete(':id')
  @RequirePermission('TASKS', 'DELETE')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete empty draft task',
    description:
      'Allowed only for OPEN tasks with no links, checklists, or subtasks. Otherwise use workflow actions.',
  })
  async remove(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    await this.tasksService.delete(id, tasksAccessFromUser(user));
  }

  // ─── LINKS ───────────────────────────────────────────────

  @Post(':id/links')
  @RequirePermission('TASKS', 'EDIT')
  @ApiOperation({ summary: 'Add link to entity' })
  async addLink(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: { entityType: string; entityId: string },
  ) {
    return this.tasksService.addLink(id, body.entityType, body.entityId, tasksAccessFromUser(user));
  }

  @Delete(':taskId/links/:linkId')
  @RequirePermission('TASKS', 'EDIT')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove link' })
  async removeLink(
    @CurrentUser() user: CurrentUserPayload,
    @Param('taskId') taskId: string,
    @Param('linkId') linkId: string,
  ) {
    await this.tasksService.removeLink(taskId, linkId, tasksAccessFromUser(user));
  }

  // ─── CHECKLISTS ──────────────────────────────────────────

  @Post(':id/checklists')
  @RequirePermission('TASKS', 'EDIT')
  @ApiOperation({ summary: 'Create checklist' })
  async createChecklist(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: { title?: string },
  ) {
    return this.tasksService.createChecklist(
      id,
      body.title ?? 'Checklist',
      tasksAccessFromUser(user),
    );
  }

  @Post('checklists/:checklistId/items')
  @ApiOperation({ summary: 'Add checklist item' })
  async addChecklistItem(
    @Param('checklistId') checklistId: string,
    @Body() body: { text: string },
  ) {
    return this.tasksService.addChecklistItem(checklistId, body.text);
  }

  @Patch('checklist-items/:itemId/toggle')
  @ApiOperation({ summary: 'Toggle checklist item' })
  async toggleChecklistItem(@Param('itemId') itemId: string) {
    return this.tasksService.toggleChecklistItem(itemId);
  }

  @Delete('checklist-items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete checklist item' })
  async deleteChecklistItem(@Param('itemId') itemId: string) {
    await this.tasksService.deleteChecklistItem(itemId);
  }

  @Delete('checklists/:checklistId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete checklist' })
  async deleteChecklist(@Param('checklistId') checklistId: string) {
    await this.tasksService.deleteChecklist(checklistId);
  }
}
