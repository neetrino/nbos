import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import {
  MESSENGER_AUTHORIZATION_EPOCH_PATTERN,
  MESSENGER_CHECKPOINT_MAX_DIGITS,
  MESSENGER_CHECKPOINT_PATTERN,
  MESSENGER_DELTA_CURSOR_MAX_LENGTH,
} from '../messenger-core-revision.constants';
import { MESSENGER_CORE_INTERNAL_LIST_PAGE_SIZE } from '../messenger-core.constants';

export class ListMessengerDeltaQueryDto {
  @IsString()
  @MaxLength(MESSENGER_CHECKPOINT_MAX_DIGITS)
  @Matches(MESSENGER_CHECKPOINT_PATTERN)
  after!: string;

  @IsOptional()
  @IsString()
  @MaxLength(MESSENGER_DELTA_CURSOR_MAX_LENGTH)
  cursor?: string;

  @IsOptional()
  @IsString()
  @Matches(MESSENGER_AUTHORIZATION_EPOCH_PATTERN)
  authorizationEpoch?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MESSENGER_CORE_INTERNAL_LIST_PAGE_SIZE)
  pageSize?: number;
}
