import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type CurrentUserPayload, RequirePermission } from '../../common/decorators';
import { PlatformSchedulerJobsService } from './platform-scheduler-jobs.service';

export type PatchSchedulerJobBody = {
  enabled: boolean;
  changeReason?: string;
};

@ApiTags('Platform Scheduler')
@ApiBearerAuth()
@Controller('platform/scheduler')
export class PlatformSchedulerJobsController {
  constructor(private readonly jobsService: PlatformSchedulerJobsService) {}

  @Get('jobs')
  @RequirePermission('COMPANY', 'VIEW')
  @ApiOperation({
    summary: 'List platform scheduler job catalog (Settings / Admin)',
    description: 'Code catalog + policy + runtime snapshot + last SchedulerRun. Toggle via PATCH.',
  })
  listJobs() {
    return this.jobsService.listJobs();
  }

  @Patch('jobs/:jobName')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({
    summary: 'Enable or disable a platform scheduler job',
    description:
      'Writes SchedulerJobPolicy and audit. High-risk jobs should confirm in UI before calling.',
  })
  patchJob(
    @CurrentUser() user: CurrentUserPayload,
    @Param('jobName') jobName: string,
    @Body() body: PatchSchedulerJobBody,
  ) {
    return this.jobsService.setJobEnabled({
      jobName,
      enabled: Boolean(body.enabled),
      actorId: user.id,
      changeReason: body.changeReason,
    });
  }
}
