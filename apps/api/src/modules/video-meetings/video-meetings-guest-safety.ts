import { VideoMeetingAdmissionStatus } from '@nbos/database';
import type { CurrentUserPayload } from '../../common/decorators';

export function mapAdmissionStatus(
  status: VideoMeetingAdmissionStatus,
): 'WAITING' | 'ADMITTED' | 'REJECTED' {
  if (status === VideoMeetingAdmissionStatus.ADMITTED) return 'ADMITTED';
  if (status === VideoMeetingAdmissionStatus.REJECTED) return 'REJECTED';
  return 'WAITING';
}

export function isMeetingAccessible(
  meeting: {
    hostEmployeeId: string;
    ownerEmployeeId: string;
    participants?: { employeeId: string | null }[];
  },
  employeeId: string,
): boolean {
  if (meeting.hostEmployeeId === employeeId || meeting.ownerEmployeeId === employeeId) {
    return true;
  }
  return (meeting.participants ?? []).some((p) => p.employeeId === employeeId);
}

export function buildEmployeeDisplayName(user: CurrentUserPayload): string {
  const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  return name || user.email;
}

/** Guest response must never carry CRM/Drive/entity-link fields. */
export function assertSafeGuestPayload(payload: unknown): void {
  const json = JSON.stringify(payload);
  const forbidden = [
    'entityLinks',
    'entityType',
    'entityId',
    'hostEmployeeId',
    'ownerEmployeeId',
    'employeeId',
    'calendarMeetingId',
    'playbackUrl',
    'recordingUrl',
    'fileAssetId',
    'r2Key',
    'objectKey',
    'egressId',
    'tokenDigest',
  ];
  for (const key of forbidden) {
    if (json.includes(`"${key}"`)) {
      throw new Error(`Unsafe guest payload key leaked: ${key}`);
    }
  }
}
