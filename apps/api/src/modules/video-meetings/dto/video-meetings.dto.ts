import { IsEnum, IsISO8601, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateVideoMeetingDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;
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
