import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, type CurrentUserPayload } from '../../common/decorators';
import { ReportsScheduleManagementService } from './reports-schedule-management.service';
import { ReportsService } from './reports.service';
import type {
  CreateReportExportJobDto,
  CreateReportScheduleDto,
  CreateSavedReportViewDto,
} from './reports.types';

@ApiTags('Reports / Analytics')
@ApiBearerAuth()
@Controller('reports')
@RequirePermission('DASHBOARDS', 'VIEW')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly scheduleManagementService: ReportsScheduleManagementService,
  ) {}

  @Get('definitions')
  @ApiOperation({
    summary: 'List Reports / Analytics report definitions',
    description:
      'Phase 7 report center registry across Finance, Sales, Marketing, Projects and Specialists/KPI.',
  })
  listDefinitions(@CurrentUser() user: CurrentUserPayload) {
    return this.reportsService.listDefinitions(user.permissions);
  }

  @Get('export-jobs')
  @ApiOperation({
    summary: 'List current user report export jobs',
    description:
      'Phase 6 export-job foundation. Completed jobs expose Drive FileAsset metadata when a real export file exists.',
  })
  listExportJobs(@CurrentUser() user: CurrentUserPayload) {
    return this.reportsService.listExportJobs(user.id, user.permissions);
  }

  @Post('export-jobs')
  @ApiOperation({
    summary: 'Request a report export job',
    description:
      'Creates an audited queued job over a module-owned report definition. File output must be completed through Drive.',
  })
  createExportJob(@CurrentUser() user: CurrentUserPayload, @Body() body: CreateReportExportJobDto) {
    return this.reportsService.createExportJob(user.id, user.permissions, body);
  }

  @Post('export-jobs/:jobId/retry')
  @ApiOperation({
    summary: 'Retry a failed or cancelled export job',
    description:
      'Creates a new queued export job from the same report definition and filters for the current user.',
  })
  retryExportJob(@CurrentUser() user: CurrentUserPayload, @Param('jobId') jobId: string) {
    return this.reportsService.retryExportJob(user.id, user.permissions, jobId);
  }

  @Post('export-jobs/:jobId/cancel')
  @ApiOperation({
    summary: 'Cancel a queued or processing export job',
    description:
      'Marks the export as cancelled. Queue workers skip cancelled jobs before writing Drive output.',
  })
  cancelExportJob(@CurrentUser() user: CurrentUserPayload, @Param('jobId') jobId: string) {
    return this.reportsService.cancelExportJob(user.id, user.permissions, jobId);
  }

  @Get('schedules')
  @ApiOperation({
    summary: 'List current user scheduled reports',
    description:
      'Phase 6 scheduled report model. Delivery workers are wired later; this endpoint exposes owner, recipients, next run, last run and failure state.',
  })
  listSchedules(@CurrentUser() user: CurrentUserPayload) {
    return this.reportsService.listSchedules(user.id, user.permissions);
  }

  @Post('schedules')
  @ApiOperation({
    summary: 'Create a scheduled report definition',
    description:
      'Stores explicit schedule metadata for a module-owned report without sending fake reports.',
  })
  createSchedule(@CurrentUser() user: CurrentUserPayload, @Body() body: CreateReportScheduleDto) {
    return this.reportsService.createSchedule(user.id, user.permissions, body);
  }

  @Get('saved-views')
  @ApiOperation({ summary: 'List current user saved report views' })
  listSavedViews(@CurrentUser() user: CurrentUserPayload) {
    return this.reportsService.listSavedViews(user.id, user.permissions);
  }

  @Post('saved-views')
  @ApiOperation({ summary: 'Create a personal saved report view' })
  createSavedView(@CurrentUser() user: CurrentUserPayload, @Body() body: CreateSavedReportViewDto) {
    return this.reportsService.createSavedView(user.id, user.permissions, body);
  }

  @Post('schedules/:scheduleId/pause')
  @ApiOperation({ summary: 'Pause an owned scheduled report' })
  pauseSchedule(@CurrentUser() user: CurrentUserPayload, @Param('scheduleId') scheduleId: string) {
    return this.scheduleManagementService.pauseSchedule(user.id, scheduleId);
  }

  @Post('schedules/:scheduleId/resume')
  @ApiOperation({ summary: 'Resume an owned scheduled report' })
  resumeSchedule(@CurrentUser() user: CurrentUserPayload, @Param('scheduleId') scheduleId: string) {
    return this.scheduleManagementService.resumeSchedule(user.id, scheduleId);
  }

  @Post('schedules/:scheduleId/archive')
  @ApiOperation({ summary: 'Archive an owned scheduled report' })
  archiveSchedule(
    @CurrentUser() user: CurrentUserPayload,
    @Param('scheduleId') scheduleId: string,
  ) {
    return this.scheduleManagementService.archiveSchedule(user.id, scheduleId);
  }

  @Get('data-quality-warnings')
  @ApiOperation({
    summary: 'List report data-quality warnings',
    description:
      'Read-only warning projection over module-owned report definitions. Reports does not recalculate module formulas.',
  })
  listDataQualityWarnings(@CurrentUser() user: CurrentUserPayload) {
    return this.reportsService.listDataQualityWarnings(user.permissions);
  }
}
