import { BadRequestException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { VideoMeetingRecordingStatus, type PrismaClient } from '@nbos/database';
import {
  VIDEO_MEETINGS_MAX_CONCURRENT_RECORDING_GROUPS_DEFAULT,
  VIDEO_MEETINGS_MAX_CONCURRENT_RECORDING_GROUPS_ENV,
} from './video-meetings-recording.constants';

type Prisma = InstanceType<typeof PrismaClient>;

const ACTIVE_RECORDING_STATUSES = [
  VideoMeetingRecordingStatus.PENDING,
  VideoMeetingRecordingStatus.RECORDING,
] as const;

/** Reads the named concurrency cap. Default is a documented dev safety valve only. */
export function readMaxConcurrentRecordingGroups(config: ConfigService): number {
  const raw = config.get<string | number | undefined>(
    VIDEO_MEETINGS_MAX_CONCURRENT_RECORDING_GROUPS_ENV,
  );
  if (raw === undefined || raw === null || raw === '') {
    return VIDEO_MEETINGS_MAX_CONCURRENT_RECORDING_GROUPS_DEFAULT;
  }
  const parsed = typeof raw === 'number' ? raw : Number.parseInt(String(raw), 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return VIDEO_MEETINGS_MAX_CONCURRENT_RECORDING_GROUPS_DEFAULT;
  }
  return parsed;
}

/**
 * Rejects recording start when the concurrent group cap is exceeded.
 * Does not end or alter the meeting itself.
 */
export async function assertRecordingCapacityAvailable(
  prisma: Prisma,
  config: ConfigService,
): Promise<void> {
  const max = readMaxConcurrentRecordingGroups(config);
  const active = await prisma.videoMeetingRecording.count({
    where: { status: { in: [...ACTIVE_RECORDING_STATUSES] } },
  });
  if (active >= max) {
    throw new BadRequestException(
      `Recording capacity exceeded: at most ${max} concurrent recording group(s) allowed (dev safety valve; not a measured production budget). Meeting left intact.`,
    );
  }
}
