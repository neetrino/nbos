import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type CurrentUserPayload, SkipTransform } from '../../../common/decorators';
import { CallsRecordingService } from './calls-recording.service';
import { CallsService } from './calls.service';
import { ClickToCallService } from './click-to-call.service';
import { ListCallsQueryDto } from './dto/list-calls-query.dto';
import { StartClickToCallDto } from './dto/start-click-to-call.dto';

@ApiTags('CRM / Calls')
@ApiBearerAuth()
@Controller('crm/calls')
export class CallsController {
  constructor(
    private readonly callsService: CallsService,
    private readonly recordingService: CallsRecordingService,
    private readonly clickToCall: ClickToCallService,
  ) {}

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

  @Post('click-to-call')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start an outbound ATS click-to-call from a CRM object' })
  startClickToCall(@CurrentUser() user: CurrentUserPayload, @Body() body: StartClickToCallDto) {
    return this.clickToCall.start(body, user);
  }

  @Get(':id/recording')
  @SkipTransform()
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({ summary: 'Stream a call recording when the viewer can see the Call' })
  streamRecording(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.recordingService.streamRecording(id, user.permissions ?? {});
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a CRM call activity by id' })
  findOne(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.callsService.findById(id, user.permissions ?? {});
  }
}
