import type { PlatformSchedulerJobRow } from '@/lib/api/scheduler-jobs';

function jobSearchText(job: PlatformSchedulerJobRow): string {
  return [job.title, job.jobName, job.group, job.description, job.ownerModule]
    .join('\n')
    .toLowerCase();
}

export function filterSchedulerJobs(
  jobs: PlatformSchedulerJobRow[],
  search: string,
): PlatformSchedulerJobRow[] {
  const query = search.trim().toLowerCase();
  if (!query) return jobs;
  return jobs.filter((job) => jobSearchText(job).includes(query));
}
