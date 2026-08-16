import { Logger } from '@nestjs/common';
import type { ProcessRole } from './process-role';
import { summarizeRedisTopology } from './queue-redis';

export function logProcessStartup(input: {
  role: ProcessRole;
  workers: string[];
  queueProducers?: string[];
  scheduledJobs?: string[];
}): void {
  const logger = new Logger('ProcessStartup');
  logger.log(
    `Started NBOS process role=${input.role} workers=${input.workers.join(',') || 'none'}` +
      (input.queueProducers ? ` queueProducers=${input.queueProducers.join(',') || 'none'}` : '') +
      (input.scheduledJobs !== undefined
        ? ` scheduledJobs=${input.scheduledJobs.join(',') || 'none'}`
        : ''),
  );
  const topology = summarizeRedisTopology();
  logger.log(
    `Redis topology queue=${topology.queue} state=${topology.state} events=${topology.events}`,
  );
}
