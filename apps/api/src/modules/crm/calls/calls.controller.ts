import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type CurrentUserPayload } from '../../../common/decorators';
import { CallsService } from './calls.service';
import { ListCallsQueryDto } from './dto/list-calls-query.dto';

@ApiTags('CRM / Calls')
@ApiBearerAuth()
@Controller('crm/calls')
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Get()
  @ApiOperation({ summary: 'List CRM call activities by Lead, Contact, or Deal' })
  @ApiQuery({ name: 'leadId', required: false, type: String })
  @ApiQuery({ name: 'contactId', required: false, type: String })
  @ApiQuery({ name: 'dealId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  findAll(@CurrentUser() user: CurrentUserPayload, @Query() query: ListCallsQueryDto) {
    return this.callsService.findAll(query, user.permissions ?? {});
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a CRM call activity by id' })
  findOne(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.callsService.findById(id, user.permissions ?? {});
  }
}
