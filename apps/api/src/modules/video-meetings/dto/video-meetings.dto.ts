import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateVideoMeetingDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  /** Attach an existing CalendarMeeting. Mutually exclusive with createCalendarMeeting. */
  @IsOptional()
  @IsUUID()
  calendarMeetingId?: string;

  /**
   * Explicitly request CalendarService.createMeeting. Standalone create omits this.
   * If Calendar throws, the video meeting is still created with calendarMeetingId null.
   */
  @IsOptional()
  @IsBoolean()
  createCalendarMeeting?: boolean;

  @ValidateIf((o: CreateVideoMeetingDto) => o.createCalendarMeeting === true)
  @IsOptional()
  @IsISO8601()
  calendarStartsAt?: string;

  @ValidateIf((o: CreateVideoMeetingDto) => o.createCalendarMeeting === true)
  @IsOptional()
  @IsISO8601()
  calendarEndsAt?: string;
}

/** Optional confirm when ending/cancelling a calendar-linked video meeting. */
export class VideoMeetingLifecycleConfirmDto {
  /**
   * When true and the meeting has calendarMeetingId, also cancel that CalendarMeeting.
   * Default false — Calendar cancel and video-room end stay separate (no hidden cascade).
   */
  @IsOptional()
  @IsBoolean()
  alsoCancelCalendarMeeting?: boolean;
}

export enum VideoMeetingEntityLinkTypeDto {
  DEAL = 'DEAL',
  PROJECT = 'PROJECT',
  PRODUCT = 'PRODUCT',
  CONTACT = 'CONTACT',
}

export class AttachVideoMeetingEntityLinkDto {
  @IsEnum(VideoMeetingEntityLinkTypeDto)
  entityType!: VideoMeetingEntityLinkTypeDto;

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  entityId!: string;
}

export enum VideoMeetingStatusFilterDto {
  CREATED = 'CREATED',
  WAITING = 'WAITING',
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  CANCELLED = 'CANCELLED',
}

export class ListVideoMeetingsQueryDto {
  @IsOptional()
  @IsEnum(VideoMeetingStatusFilterDto)
  status?: VideoMeetingStatusFilterDto;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  pageSize?: string;
}

export class CreateVideoMeetingInviteDto {
  @IsISO8601()
  expiresAt!: string;
}

export class VideoMeetingTokenRequestDto {
  /** Optional; when set must match the meeting session room name. */
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  roomName?: string;
}

export class GuestPrejoinDto {
  @IsString()
  @MinLength(16)
  @MaxLength(256)
  inviteToken!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName!: string;
}

export class GuestTokenDto {
  @IsString()
  @MinLength(16)
  @MaxLength(256)
  inviteToken!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  roomName?: string;
}

export enum VideoMeetingConsentDecisionDto {
  GRANTED = 'GRANTED',
  DECLINED = 'DECLINED',
  REVOKED = 'REVOKED',
}

export class VideoMeetingConsentDecisionBodyDto {
  @IsEnum(VideoMeetingConsentDecisionDto)
  decision!: VideoMeetingConsentDecisionDto;
}

export class GuestConsentDto {
  @IsString()
  @MinLength(16)
  @MaxLength(256)
  inviteToken!: string;

  @IsEnum(VideoMeetingConsentDecisionDto)
  decision!: VideoMeetingConsentDecisionDto;
}
