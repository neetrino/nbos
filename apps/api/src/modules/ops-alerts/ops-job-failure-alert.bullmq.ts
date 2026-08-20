export type BullmqFailureJobLike = {
  id?: string;
  name: string;
  attemptsMade: number;
  opts?: { attempts?: number };
};

export function resolveBullmqMaxAttempts(job: BullmqFailureJobLike): number {
  return job.opts?.attempts ?? 1;
}

/** True when BullMQ will not retry this failure again. */
export function isBullmqJobFinallyFailed(job: BullmqFailureJobLike): boolean {
  return job.attemptsMade >= resolveBullmqMaxAttempts(job);
}
