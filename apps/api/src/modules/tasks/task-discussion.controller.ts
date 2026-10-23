import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { actorContextFromEmployee } from '@nbos/shared';
import {
  CurrentUser,
  type CurrentUserPayload,
  RequireAnyPermission,
  RequirePermission,
} from '../../common/decorators';
import { tasksAccessFromUser } from './tasks-scoped-access';
import { readDiscussionIdempotencyKey, readDiscussionReplyId } from './task-discussion.rules';
import { TaskDiscussionService } from './task-discussion.service';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TaskDiscussionController {
  constructor(private readonly discussion: TaskDiscussionService) {}

  @Get(':id/discussion')
  @RequirePermission('TASKS', 'VIEW')
  @ApiOperation({ summary: 'List Task Discussion from Messaging Core' })
  async list(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.discussion.listEntries(
      id,
      {
        page: page ? Number.parseInt(page, 10) : undefined,
        pageSize: pageSize ? Number.parseInt(pageSize, 10) : undefined,
        latest: page === undefined,
      },
      tasksAccessFromUser(user),
    );
  }

  @Post(':id/discussion')
  @RequireAnyPermission({ module: 'TASKS', action: 'VIEW' }, { module: 'TASKS', action: 'EDIT' })
  @ApiOperation({
    summary: 'Add a Task Discussion note. Opening the Task is enough; Task edit is not required.',
  })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: { body?: unknown; idempotencyKey?: unknown; replyToMessageId?: unknown },
  ) {
    return this.discussion.addEntry(
      id,
      actorContextFromEmployee(
        { id: user.id, firstName: user.firstName, lastName: user.lastName },
        { channel: { source: 'web' } },
      ),
      body.body,
      tasksAccessFromUser(user),
      undefined,
      readDiscussionIdempotencyKey(body.idempotencyKey),
      readDiscussionReplyId(body.replyToMessageId),
    );
  }
}
