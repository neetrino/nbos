import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type CurrentUserPayload,
  RequirePermission,
} from '../../../common/decorators';
import { tasksAccessFromUser } from '../../tasks/tasks-scoped-access';
import { AttachTaskSourcesDto } from './dto/attach-task-sources.dto';
import { AttachTicketSourcesDto } from './dto/attach-ticket-sources.dto';
import { MessengerCoreActionsService } from './messenger-core-actions.service';

@ApiTags('Messenger Core Actions')
@ApiBearerAuth()
@Controller('messenger/core')
export class MessengerCoreActionsController {
  constructor(private readonly actions: MessengerCoreActionsService) {}

  @Get('messages/:id')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({
    summary: 'Open a canonical source message by source id when the caller can READ it',
  })
  getSourceMessage(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.actions.getSourceMessage(user.id, id);
  }

  @Delete('messages/references/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('MESSENGER', 'EDIT')
  @ApiOperation({ summary: 'Delete a message reference without deleting the source message' })
  deleteReference(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.actions.deleteReference(user.id, id, tasksAccessFromUser(user));
  }

  @Post('messages/task-sources')
  @RequirePermission('MESSENGER', 'EDIT')
  @ApiOperation({
    summary: 'Attach TASK_SOURCE after Task create; requires Task access (does not ensure chat)',
  })
  attachTaskSources(@CurrentUser() user: CurrentUserPayload, @Body() body: AttachTaskSourcesDto) {
    return this.actions.attachTaskSources(
      user.id,
      body.sourceMessageIds,
      body.taskId,
      tasksAccessFromUser(user),
    );
  }

  @Post('messages/ticket-sources')
  @RequirePermission('SUPPORT_TICKETS', 'ADD')
  @ApiOperation({
    summary: 'Attach TICKET_SOURCE after Ticket create/link; requires source Client READ',
  })
  attachTicketSources(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: AttachTicketSourcesDto,
  ) {
    return this.actions.attachTicketSources(user.id, body.sourceMessageIds, body.ticketId);
  }

  @Get('tickets/:ticketId/source-messages')
  @RequirePermission('SUPPORT_TICKETS', 'VIEW')
  @ApiOperation({
    summary: 'List Ticket source references; preview requires Client conversation READ',
  })
  listTicketSources(@Param('ticketId') ticketId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.actions.listTicketSources(user.id, ticketId);
  }
}
