import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../common/decorators';
import { ServiceApiKeyGuard } from '../../common/guards/service-api-key.guard';
import { Inject } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { ScheduledJobRegistry } from './scheduled-job-registry';
import { SchedulerRunService } from './scheduler-run.service';

@ApiTags('Scheduler')
@ApiSecurity('scheduler-key')
@Public()
@SkipThrottle()
@UseGuards(ServiceApiKeyGuard)
@Controller('internal/scheduler')
export class SchedulerDiagnosticsController {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly runs: SchedulerRunService,
    private readonly jobRegistry: ScheduledJobRegistry,
  ) {}

  @Get('jobs')
  @ApiOperation({ summary: 'List registered cron jobs + current leases (scheduler key)' })
  async listJobs() {
    const leases = await this.prisma.schedulerLease.findMany({
      orderBy: { jobName: 'asc' },
    });
    return {
      registered: this.jobRegistry.list(),
      leases: leases.map((lease) => ({
        jobName: lease.jobName,
        ownerId: lease.ownerId,
        leaseUntil: lease.leaseUntil,
        heartbeatAt: lease.heartbeatAt,
        fencingToken: lease.fencingToken.toString(),
      })),
    };
  }

  @Get('runs')
  @ApiOperation({ summary: 'Recent SchedulerRun history (scheduler key)' })
  async listRuns(@Query('jobName') jobName?: string, @Query('limit') limit?: string) {
    const take = limit ? Number.parseInt(limit, 10) : 50;
    if (jobName?.trim()) {
      return this.runs.listByJob(jobName.trim(), take);
    }
    return this.runs.listRecent(take);
  }
}
