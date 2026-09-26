import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

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
