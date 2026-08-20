type JobPolicyChecker = (jobName: string) => Promise<boolean>;

let checker: JobPolicyChecker | null = null;

/** Wired by SchedulerJobPolicyService.onModuleInit for cron tick gates. */
export function setSchedulerJobPolicyChecker(next: JobPolicyChecker): void {
  checker = next;
}

/** Fail closed when policy service is not wired (tests must set a checker or mock). */
export async function isSchedulerJobPolicyEnabled(jobName: string): Promise<boolean> {
  if (checker === null) return false;
  return checker(jobName);
}

/** Test helper — clears module-level wiring. */
export function resetSchedulerJobPolicyChecker(): void {
  checker = null;
}
