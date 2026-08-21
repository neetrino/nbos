import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type CurrentUserPayload, SkipTransform } from '../../../common/decorators';
import { CallsRecordingService } from './calls-recording.service';
import { CallsService } from './calls.service';
import { ClickToCallService } from './click-to-call.service';
import { ActiveCallScreenService } from './active-call-screen.service';
import { ListCallsQueryDto } from './dto/list-calls-query.dto';
import { StartClickToCallDto } from './dto/start-click-to-call.dto';
import { UpdateCallNoteDto } from './dto/update-call-note.dto';

@ApiTags('CRM / Calls')
@ApiBearerAuth()
@Controller('crm/calls')
export class CallsController {
  constructor(
    private readonly callsService: CallsService,
    private readonly recordingService: CallsRecordingService,
    private readonly clickToCall: ClickToCallService,
    private readonly activeCallScreen: ActiveCallScreenService,
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

  @Get(':id/screen')
  @ApiOperation({ summary: 'Active Call Screen snapshot for one AtsCallEvent' })
  getScreen(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.activeCallScreen.getScreen(id, user.permissions ?? {});
  }

  @Patch(':id/note')
  @ApiOperation({ summary: 'Save a note on a Call after it ends' })
  updateNote(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateCallNoteDto,
  ) {
    return this.activeCallScreen.updateNote(id, body.note?.trim() || null, user.permissions ?? {});
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
