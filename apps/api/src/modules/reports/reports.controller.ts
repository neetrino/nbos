import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type CurrentUserPayload } from '../../common/decorators';
import { ReportsService } from './reports.service';
import type { CreateReportExportJobDto, CreateReportScheduleDto } from './reports.types';

@ApiTags('Reports / Analytics')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('export-jobs')
  @ApiOperation({
    summary: 'List current user report export jobs',
    description:
      'Phase 6 export-job foundation. Completed jobs expose Drive FileAsset metadata when a real export file exists.',
  })
  listExportJobs(@CurrentUser() user: CurrentUserPayload) {
    return this.reportsService.listExportJobs(user.id);
  }

  @Post('export-jobs')
  @ApiOperation({
    summary: 'Request a report export job',
    description:
      'Creates an audited queued job over a module-owned report definition. File output must be completed through Drive.',
  })
  createExportJob(@CurrentUser() user: CurrentUserPayload, @Body() body: CreateReportExportJobDto) {
    return this.reportsService.createExportJob(user.id, body);
  }

  @Get('schedules')
  @ApiOperation({
    summary: 'List current user scheduled reports',
    description:
      'Phase 6 scheduled report model. Delivery workers are wired later; this endpoint exposes owner, recipients, next run, last run and failure state.',
  })
  listSchedules(@CurrentUser() user: CurrentUserPayload) {
    return this.reportsService.listSchedules(user.id);
  }

  @Post('schedules')
  @ApiOperation({
    summary: 'Create a scheduled report definition',
    description:
      'Stores explicit schedule metadata for a module-owned report without sending fake reports.',
  })
  createSchedule(@CurrentUser() user: CurrentUserPayload, @Body() body: CreateReportScheduleDto) {
    return this.reportsService.createSchedule(user.id, body);
  }

  @Get('data-quality-warnings')
  @ApiOperation({
    summary: 'List report data-quality warnings',
    description:
      'Read-only warning projection over module-owned report definitions. Reports does not recalculate module formulas.',
  })
  listDataQualityWarnings() {
    return this.reportsService.listDataQualityWarnings();
  }
}
