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
import { TasksService } from './tasks.service';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tasks with filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'assigneeId', required: false })
  @ApiQuery({ name: 'creatorId', required: false })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('creatorId') creatorId?: string,
    @Query('parentId') parentId?: string,
    @Query('hasParent') hasParent?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.tasksService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      status,
      priority,
      assigneeId,
      creatorId,
      parentId,
      hasParent: hasParent === 'false' ? false : undefined,
      entityType,
      entityId,
      search,
      sortBy,
      sortOrder,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get task statistics' })
  async getStats() {
    return this.tasksService.getStats();
  }

  @Get('by-entity/:entityType/:entityId')
  @ApiOperation({ summary: 'Get tasks linked to an entity' })
  async findByEntity(@Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.tasksService.findByEntity(entityType, entityId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  async findOne(@Param('id') id: string) {
    return this.tasksService.findById(id);
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
      startDate?: string;
      dueDate?: string;
      parentId?: string;
      links?: Array<{ entityType: string; entityId: string }>;
    },
  ) {
    return this.tasksService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update task' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      assigneeId?: string | null;
      coAssignees?: string[];
      observers?: string[];
      priority?: string;
      startDate?: string | null;
      dueDate?: string | null;
      parentId?: string | null;
      kanbanStageId?: string | null;
      myPlanStageId?: string | null;
      myPlanSortOrder?: number;
    },
  ) {
    return this.tasksService.update(id, body);
  }

  @Patch(':id/start')
  @ApiOperation({ summary: 'Start task' })
  async start(@Param('id') id: string) {
    return this.tasksService.start(id);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Complete task' })
  async complete(@Param('id') id: string) {
    return this.tasksService.complete(id);
  }

  @Patch(':id/reopen')
  @ApiOperation({ summary: 'Reopen task' })
  async reopen(@Param('id') id: string) {
    return this.tasksService.reopen(id);
  }

  @Patch(':id/defer')
  @ApiOperation({ summary: 'Defer task' })
  async defer(@Param('id') id: string) {
    return this.tasksService.defer(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete task' })
  async remove(@Param('id') id: string) {
    await this.tasksService.delete(id);
  }

  // ─── LINKS ───────────────────────────────────────────────

  @Post(':id/links')
  @ApiOperation({ summary: 'Add link to entity' })
  async addLink(@Param('id') id: string, @Body() body: { entityType: string; entityId: string }) {
    return this.tasksService.addLink(id, body.entityType, body.entityId);
  }

  @Delete(':taskId/links/:linkId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove link' })
  async removeLink(@Param('taskId') taskId: string, @Param('linkId') linkId: string) {
    await this.tasksService.removeLink(taskId, linkId);
  }

  // ─── CHECKLISTS ──────────────────────────────────────────

  @Post(':id/checklists')
  @ApiOperation({ summary: 'Create checklist' })
  async createChecklist(@Param('id') id: string, @Body() body: { title?: string }) {
    return this.tasksService.createChecklist(id, body.title ?? 'Checklist');
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
