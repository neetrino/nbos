import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaClient } from '@nbos/database';
import { Public } from '../../common/decorators';
import { SkipThrottle } from '@nestjs/throttler';
import { PRISMA_TOKEN } from '../../database.module';
import { checkPrismaReadiness } from '../../database/db-readiness';
import { ScheduledJobRegistry } from './scheduled-job-registry';
import { isSchedulerEnabled } from './scheduler-lease.constants';

@ApiTags('Scheduler')
@Public()
@SkipThrottle()
@Controller()
export class SchedulerReadyController {
  constructor(
    private readonly jobRegistry: ScheduledJobRegistry,
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
  ) {}

  @Get('ready')
  async ready() {
    if (this.jobRegistry.isShuttingDown() || !this.jobRegistry.isStartupComplete()) {
      throw new ServiceUnavailableException({ ready: false, reason: 'startup_or_shutdown' });
    }
    const jobs = this.jobRegistry.list();
    const enabled = isSchedulerEnabled();
    if (enabled && jobs.length === 0) {
      throw new ServiceUnavailableException({ ready: false, reason: 'no_jobs' });
    }
    const db = await checkPrismaReadiness(this.prisma);
    if (!db.ok) {
      throw new ServiceUnavailableException({ ready: false, reason: 'database_unavailable' });
    }
    return { ready: true, jobs, schedulerEnabled: enabled, database: true, cached: db.cached };
  }
}
