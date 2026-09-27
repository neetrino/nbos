import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { VIDEO_MEETING_MESSAGE_MAX_LENGTH } from '../video-meetings.constants';
import { VideoMeetingEntityLinkTypeDto } from './video-meetings.dto';

const INVITE_TOKEN_MIN_LENGTH = 16;
const INVITE_TOKEN_MAX_LENGTH = 256;
const ENTITY_ID_MAX_LENGTH = 64;

export class VideoMeetingByEntityQueryDto {
  @IsEnum(VideoMeetingEntityLinkTypeDto)
  entityType!: VideoMeetingEntityLinkTypeDto;

  @IsString()
  @MinLength(1)
  @MaxLength(ENTITY_ID_MAX_LENGTH)
  entityId!: string;
}

export class PostVideoMeetingMessageDto {
  /** Plain text; trimmed server-side. Empty after trim is rejected. */
  @IsString()
  @MinLength(1)
  @MaxLength(VIDEO_MEETING_MESSAGE_MAX_LENGTH)
  body!: string;
}

export class GuestThreadDto {
  @IsString()
  @MinLength(INVITE_TOKEN_MIN_LENGTH)
  @MaxLength(INVITE_TOKEN_MAX_LENGTH)
  inviteToken!: string;
}

export class GuestPostMessageDto extends GuestThreadDto {
  @IsString()
  @MinLength(1)
  @MaxLength(VIDEO_MEETING_MESSAGE_MAX_LENGTH)
  body!: string;
}
