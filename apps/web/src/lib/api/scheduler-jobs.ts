import { api } from '../api';

export type SchedulerCatalogStatus =
  | 'active'
  | 'paused'
  | 'blocked'
  | 'running'
  | 'failed'
  | 'schedulerOffline'
  | 'manual'
  | 'disabledByCanon';

export type PlatformSchedulerJobRow = {
  jobName: string;
  title: string;
  description: string;
  ownerModule: string;
  group: string;
  risk: 'low' | 'medium' | 'high';
  kind: 'platform_cron' | 'manual_only' | 'not_a_cron';
  rosterIntent: 'on' | 'off' | 'manual';
  defaultExpression: string | null;
  expression: string | null;
  timezone: string | null;
  status: SchedulerCatalogStatus;
  enabledByEnv: boolean | null;
  policyEnabled: boolean | null;
  masterEnabled: boolean | null;
  registered: boolean | null;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  lastErrorMessage: string | null;
  nextRunAt: string | null;
  runtimeHeartbeatAt: string | null;
  canToggle: boolean;
  canRunNow: boolean;
};

export type PlatformSchedulerJobsResponse = {
  generatedAt: string;
  timezone: string;
  masterEnabled: boolean | null;
  schedulerOnline: boolean;
  note: string;
  jobs: PlatformSchedulerJobRow[];
};

export type PlatformSchedulerRunNowResponse = {
  jobName: string;
  trigger: 'manual_admin';
  result: unknown;
};

export const schedulerJobsApi = {
  async listJobs(): Promise<PlatformSchedulerJobsResponse> {
    const resp = await api.get<PlatformSchedulerJobsResponse>('/api/platform/scheduler/jobs');
    return resp.data;
  },
  async setJobEnabled(
    jobName: string,
    body: { enabled: boolean; changeReason?: string },
  ): Promise<PlatformSchedulerJobRow> {
    const resp = await api.patch<PlatformSchedulerJobRow>(
      `/api/platform/scheduler/jobs/${encodeURIComponent(jobName)}`,
      body,
    );
    return resp.data;
  },
  async runJobNow(jobName: string): Promise<PlatformSchedulerRunNowResponse> {
    const resp = await api.post<PlatformSchedulerRunNowResponse>(
      `/api/platform/scheduler/jobs/${encodeURIComponent(jobName)}/run`,
    );
    return resp.data;
  },
};
