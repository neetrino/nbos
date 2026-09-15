import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CALLS_MODULE } from '@nbos/shared';
import {
  CurrentUser,
  type CurrentUserPayload,
  RequirePermission,
} from '../../../common/decorators';
import { callAccessActorFromUser } from './call-access.types';
import { CallsService } from './calls.service';
import { ListCallJournalQueryDto } from './dto/list-call-journal-query.dto';

@ApiTags('Calls')
@ApiBearerAuth()
@Controller('calls')
export class CallsJournalController {
  constructor(private readonly callsService: CallsService) {}

  @Get()
  @RequirePermission(CALLS_MODULE, 'VIEW')
  @ApiOperation({ summary: 'List company call journal rows the actor may see' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  findJournal(@CurrentUser() user: CurrentUserPayload, @Query() query: ListCallJournalQueryDto) {
    return this.callsService.findJournal(query, callAccessActorFromUser(user));
  }
}
