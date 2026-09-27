import type { DurationGuardPhase } from '@nbos/shared';
import { api } from '../api';

export type DurationGuardResponse = {
  phase: DurationGuardPhase;
  checkpointAt: string | null;
  remainingMs: number;
  centered: boolean;
};

export async function getDurationGuard(meetingId: string): Promise<DurationGuardResponse> {
  const resp = await api.get<DurationGuardResponse>(
    `/api/video-meetings/${meetingId}/duration-guard`,
  );
  return resp.data;
}

export async function continueDurationGuard(meetingId: string): Promise<DurationGuardResponse> {
  const resp = await api.post<DurationGuardResponse>(
    `/api/video-meetings/${meetingId}/duration-guard/continue`,
  );
  return resp.data;
}

export async function expireDurationGuard(meetingId: string): Promise<{ ended: boolean }> {
  const resp = await api.post<{ ended: boolean }>(
    `/api/video-meetings/${meetingId}/duration-guard/expire`,
  );
  return resp.data;
}
