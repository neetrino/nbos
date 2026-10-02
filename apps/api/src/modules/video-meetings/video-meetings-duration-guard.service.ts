import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient, VideoMeetingStatus } from '@nbos/database';
import { durationGuardSnapshot, type DurationGuardPhase } from '@nbos/shared';
import { PRISMA_TOKEN } from '../../database.module';
import type { CurrentUserPayload } from '../../common/decorators';
import { closeOpenMeetingRoom } from './video-meetings-close-room';
import { VideoMeetingsLivekitService } from './video-meetings-livekit.service';
import { VideoMeetingsRecordingService } from './video-meetings-recording.service';
import { assertTeammateConnected, requireMeetingTeammate } from './video-meetings-teammate-access';

const DURATION_GUARD_SWEEP_BATCH = 50;

export type DurationGuardDto = {
  phase: DurationGuardPhase;
  checkpointAt: string | null;
  remainingMs: number;
  centered: boolean;
};

type OpenSession = {
  id: string;
  meetingId: string;
  startedAt: Date | null;
  durationContinuedThrough: Date | null;
};

@Injectable()
export class VideoMeetingsDurationGuardService {
  private readonly logger = new Logger(VideoMeetingsDurationGuardService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly livekit: VideoMeetingsLivekitService,
    private readonly recordings: VideoMeetingsRecordingService,
  ) {}

  async state(user: CurrentUserPayload, meetingId: string): Promise<DurationGuardDto> {
    await this.requireConnectedTeammate(user.id, meetingId);
    const session = await this.openSession(meetingId);
    return this.toDto(session, new Date());
  }

  async continue(user: CurrentUserPayload, meetingId: string): Promise<DurationGuardDto> {
    await this.requireConnectedTeammate(user.id, meetingId);
    const session = await this.openSession(meetingId);
    if (!session?.startedAt) {
      throw new BadRequestException('Meeting is not live');
    }
    const now = new Date();
    const snapshot = durationGuardSnapshot(
      session.startedAt,
      session.durationContinuedThrough,
      now,
    );
    if (snapshot.phase !== 'warning') {
      throw new BadRequestException('Continuation is not open');
    }
    await this.prisma.videoMeetingSession.update({
      where: { id: session.id },
      data: {
        durationContinuedThrough: snapshot.checkpointAt,
        durationContinuedAt: now,
        durationContinuedByEmployeeId: user.id,
      },
    });
    return this.toDto({ ...session, durationContinuedThrough: snapshot.checkpointAt }, now);
  }

  async expireForTeammate(
    user: CurrentUserPayload,
    meetingId: string,
  ): Promise<{ ended: boolean }> {
    await this.requireConnectedTeammate(user.id, meetingId);
    return { ended: await this.expireIfDue(meetingId) };
  }

  /** Ends this live meeting when its checkpoint has passed. Idempotent. */
  async expireIfDue(meetingId: string, now = new Date()): Promise<boolean> {
    const session = await this.openSession(meetingId);
    if (!session || !this.checkpointDue(session, now)) return false;
    return this.finishMeeting(session.meetingId, now);
  }

  async sweepDue(now = new Date()): Promise<number> {
    const sessions = await this.prisma.videoMeetingSession.findMany({
      where: {
        endedAt: null,
        startedAt: { not: null },
        meeting: { status: VideoMeetingStatus.ACTIVE },
      },
      select: { id: true, meetingId: true, startedAt: true, durationContinuedThrough: true },
      take: DURATION_GUARD_SWEEP_BATCH,
      orderBy: { startedAt: 'asc' },
    });
    let ended = 0;
    for (const session of sessions) {
      try {
        if (await this.expireSession(session, now)) ended += 1;
      } catch (error) {
        this.logger.warn(
          `Duration guard failed for meeting ${session.meetingId}: ${String(error)}`,
        );
      }
    }
    return ended;
  }

  private async expireSession(session: OpenSession, now: Date): Promise<boolean> {
    if (!this.checkpointDue(session, now)) return false;
    return this.finishMeeting(session.meetingId, now);
  }

  private async finishMeeting(meetingId: string, now: Date): Promise<boolean> {
    const session = await this.openSession(meetingId);
    if (!this.checkpointDue(session, now)) return false;
    await this.recordings.stopIfRecordingOnMeetingEnd(meetingId);
    await closeOpenMeetingRoom(this.prisma, this.livekit, meetingId);
    const endedAt = new Date();
    const ended = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.videoMeeting.updateMany({
        where: { id: meetingId, status: VideoMeetingStatus.ACTIVE },
        data: { status: VideoMeetingStatus.IDLE, endedAt },
      });
      if (updated.count === 0) return false;
      await tx.videoMeetingSession.updateMany({
        where: { meetingId, endedAt: null },
        data: { endedAt },
      });
      return true;
    });
    if (ended) this.logger.log(`Duration guard ended meeting ${meetingId}`);
    return ended;
  }

  private async requireConnectedTeammate(employeeId: string, meetingId: string): Promise<void> {
    const access = await requireMeetingTeammate(this.prisma, meetingId, employeeId);
    if (!this.livekit.isConfigured()) return;
    const identities = await this.livekit.listParticipantIdentities(access.roomName);
    assertTeammateConnected(access.participantId, identities);
  }

  private checkpointDue(session: OpenSession | null, now: Date): boolean {
    if (!session?.startedAt) return false;
    return (
      durationGuardSnapshot(session.startedAt, session.durationContinuedThrough, now).phase ===
      'due'
    );
  }

  private async openSession(meetingId: string): Promise<OpenSession | null> {
    const meeting = await this.prisma.videoMeeting.findUnique({
      where: { id: meetingId },
      select: { status: true },
    });
    if (!meeting || meeting.status !== VideoMeetingStatus.ACTIVE) return null;
    return this.prisma.videoMeetingSession.findFirst({
      where: { meetingId, endedAt: null },
      orderBy: { createdAt: 'desc' },
      select: { id: true, meetingId: true, startedAt: true, durationContinuedThrough: true },
    });
  }

  private toDto(session: OpenSession | null, now: Date): DurationGuardDto {
    if (!session?.startedAt) {
      return { phase: 'quiet', checkpointAt: null, remainingMs: 0, centered: false };
    }
    const snapshot = durationGuardSnapshot(
      session.startedAt,
      session.durationContinuedThrough,
      now,
    );
    return {
      phase: snapshot.phase,
      checkpointAt: snapshot.checkpointAt.toISOString(),
      remainingMs: snapshot.remainingMs,
      centered: snapshot.centered,
    };
  }
}
