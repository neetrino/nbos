import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators';
import { PlatformSchedulerJobsService } from './platform-scheduler-jobs.service';

@ApiTags('Platform Scheduler')
@Controller('platform/scheduler')
export class PlatformSchedulerJobsController {
  constructor(private readonly jobsService: PlatformSchedulerJobsService) {}

  @Get('jobs')
  @RequirePermission('COMPANY', 'VIEW')
  @ApiOperation({
    summary: 'List platform scheduler job catalog (Settings / Admin)',
    description:
      'Code catalog + SchedulerJobRuntime snapshot + last SchedulerRun. Read-only; enable/disable is stage 2.',
  })
  listJobs() {
    return this.jobsService.listJobs();
  }
}
