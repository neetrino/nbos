import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, type CurrentUserPayload } from '../../common/decorators';
import {
  AssignOrgSeatDto,
  CreateOrgSeatDto,
  EndOrgSeatAssignmentDto,
  ListOrgSeatsQueryDto,
  UpdateOrgSeatDto,
  PreviewOrgSeatDto,
} from './org-seat.dto';
import { OrgSeatAssignmentsService } from './org-seat-assignments.service';
import { OrgSeatsService } from './org-seats.service';
import { OrgSeatAccessPreviewService } from './org-seat-access-preview.service';

@ApiTags('Org Seats')
@ApiBearerAuth()
@Controller('org-seats')
export class OrgSeatsController {
  constructor(
    private readonly seats: OrgSeatsService,
    private readonly assignments: OrgSeatAssignmentsService,
    private readonly accessPreview: OrgSeatAccessPreviewService,
  ) {}

  @Get()
  @RequirePermission('COMPANY', 'VIEW')
  @ApiOperation({ summary: 'List active business seats and assignments' })
  findAll(@Query() query: ListOrgSeatsQueryDto) {
    return this.seats.findAll(query.departmentId);
  }

  @Get(':id')
  @RequirePermission('COMPANY', 'VIEW')
  @ApiOperation({ summary: 'Get one business seat' })
  findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.seats.findById(id);
  }

  @Post()
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Create a business seat' })
  create(@Body() body: CreateOrgSeatDto, @CurrentUser() actor: CurrentUserPayload) {
    return this.seats.create(body, actor);
  }

  @Get(':id/history')
  @RequirePermission('COMPANY', 'VIEW')
  history(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.seats.history(id);
  }

  @Post(':id/access-preview')
  @RequirePermission('SETTINGS_RBAC', 'VIEW')
  preview(@Param('id', new ParseUUIDPipe()) id: string, @Body() body: PreviewOrgSeatDto) {
    return this.accessPreview.preview(id, body);
  }

  @Patch(':id')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Update a business seat' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateOrgSeatDto,
    @CurrentUser() actor: CurrentUserPayload,
  ) {
    return this.seats.update(id, body, actor);
  }

  @Post(':id/archive')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Archive a vacant business seat' })
  archive(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() actor: CurrentUserPayload) {
    return this.seats.archive(id, actor);
  }

  @Post(':id/assignments')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Assign an employee and provision the seat permission role' })
  assign(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: AssignOrgSeatDto,
    @CurrentUser() actor: CurrentUserPayload,
  ) {
    return this.assignments.assign(id, body, actor);
  }

  @Post('assignments/:assignmentId/end')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'End a seat assignment and revoke its sourced permission role' })
  endAssignment(
    @Param('assignmentId', new ParseUUIDPipe()) assignmentId: string,
    @Body() body: EndOrgSeatAssignmentDto,
    @CurrentUser() actor: CurrentUserPayload,
  ) {
    return this.assignments.end(assignmentId, actor, body.reason);
  }
}
