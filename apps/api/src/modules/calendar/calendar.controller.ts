import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser, type CurrentUserPayload, RequirePermission } from '../../common/decorators';
import { CalendarService } from './calendar.service';
import type {
  CalendarLayer,
  CreateCalendarMeetingDto,
  CreatePersonalCalendarEventDto,
  UpdateCalendarMeetingDto,
  UpdatePersonalCalendarEventDto,
} from './calendar.types';

type AuthedRequest = Request & { permissionScope?: string };

@ApiTags('Calendar')
@ApiBearerAuth()
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('events')
  @RequirePermission('CALENDAR', 'VIEW')
  @ApiOperation({ summary: 'List Calendar projections for the agreed Phase 5 layers' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'layer', required: false })
  async listEvents(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: AuthedRequest,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('layer') layer?: CalendarLayer,
  ) {
    return this.calendarService.listEvents(user.id, req.permissionScope ?? 'OWN', {
      from,
      to,
      layer,
    });
  }

  @Post('meetings')
  @RequirePermission('CALENDAR', 'ADD')
  @ApiOperation({ summary: 'Create a client-facing calendar meeting' })
  async createMeeting(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: CreateCalendarMeetingDto,
  ) {
    return this.calendarService.createMeeting(user.id, body);
  }

  @Patch('meetings/:id')
  @RequirePermission('CALENDAR', 'EDIT')
  @ApiOperation({ summary: 'Update a client-facing calendar meeting' })
  async updateMeeting(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() body: UpdateCalendarMeetingDto,
  ) {
    return this.calendarService.updateMeeting(user.id, req.permissionScope ?? 'OWN', id, body);
  }

  @Post('personal-events')
  @RequirePermission('CALENDAR', 'ADD')
  @ApiOperation({ summary: 'Create a private personal calendar event' })
  async createPersonalEvent(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: CreatePersonalCalendarEventDto,
  ) {
    return this.calendarService.createPersonalEvent(user.id, body);
  }

  @Patch('personal-events/:id')
  @RequirePermission('CALENDAR', 'EDIT')
  @ApiOperation({ summary: 'Update a private personal calendar event' })
  async updatePersonalEvent(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: UpdatePersonalCalendarEventDto,
  ) {
    return this.calendarService.updatePersonalEvent(user.id, id, body);
  }
}
