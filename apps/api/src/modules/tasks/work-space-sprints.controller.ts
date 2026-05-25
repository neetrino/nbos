import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators';
import { WorkSpaceSprintsService } from './work-space-sprints.service';

@ApiTags('Work Space Sprints')
@ApiBearerAuth()
@Controller('tasks/work-spaces/:workspaceId/sprints')
export class WorkSpaceSprintsController {
  constructor(private readonly sprintsService: WorkSpaceSprintsService) {}

  @Get()
  @RequirePermission('TASKS', 'VIEW')
  @ApiOperation({ summary: 'List sprints for a Work Space' })
  list(@Param('workspaceId') workspaceId: string) {
    return this.sprintsService.list(workspaceId);
  }

  @Post()
  @RequirePermission('TASKS', 'ADD')
  @ApiOperation({ summary: 'Create planning sprint' })
  create(
    @Param('workspaceId') workspaceId: string,
    @Body() body: { name: string; goal?: string; startDate?: string; endDate?: string },
  ) {
    return this.sprintsService.create(workspaceId, body);
  }

  @Patch(':sprintId')
  @RequirePermission('TASKS', 'EDIT')
  @ApiOperation({ summary: 'Update sprint metadata' })
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('sprintId') sprintId: string,
    @Body()
    body: {
      name?: string;
      goal?: string | null;
      startDate?: string | null;
      endDate?: string | null;
    },
  ) {
    return this.sprintsService.update(workspaceId, sprintId, body);
  }

  @Post(':sprintId/start')
  @RequirePermission('TASKS', 'EDIT')
  @ApiOperation({ summary: 'Start planning sprint (becomes active)' })
  start(@Param('workspaceId') workspaceId: string, @Param('sprintId') sprintId: string) {
    return this.sprintsService.start(workspaceId, sprintId);
  }

  @Post(':sprintId/close')
  @RequirePermission('TASKS', 'EDIT')
  @ApiOperation({ summary: 'Close active sprint' })
  close(
    @Param('workspaceId') workspaceId: string,
    @Param('sprintId') sprintId: string,
    @Body() body: { unfinishedTaskAction?: string; nextSprintId?: string },
  ) {
    return this.sprintsService.close(workspaceId, sprintId, body);
  }

  @Post('move-task/:taskId')
  @RequirePermission('TASKS', 'EDIT')
  @ApiOperation({ summary: 'Move task to sprint or backlog' })
  moveTask(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @Body() body: { sprintId: string | null },
  ) {
    return this.sprintsService.moveTask(workspaceId, taskId, body.sprintId ?? null);
  }
}
