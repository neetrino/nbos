import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { SkipThrottle } from '@nestjs/throttler';
import { ScheduledJobRegistry } from './scheduled-job-registry';
import { isSchedulerEnabled } from './scheduler-lease.constants';

@ApiTags('Scheduler')
@Public()
@SkipThrottle()
@Controller()
export class SchedulerReadyController {
  constructor(private readonly jobRegistry: ScheduledJobRegistry) {}

  @Get('ready')
  ready() {
    if (this.jobRegistry.isShuttingDown() || !this.jobRegistry.isStartupComplete()) {
      throw new ServiceUnavailableException({ ready: false, reason: 'startup_or_shutdown' });
    }
    const jobs = this.jobRegistry.list();
    const enabled = isSchedulerEnabled();
    if (enabled && jobs.length === 0) {
      throw new ServiceUnavailableException({ ready: false, reason: 'no_jobs' });
    }
    return { ready: true, jobs, schedulerEnabled: enabled };
  }
}
