import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { MESSENGER_CORE_INTERNAL_MESSAGE_PAGE_SIZE } from '../messenger-core.constants';

export class ListCoreMessagesQueryDto {
  @IsOptional()
  @IsString()
  before?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MESSENGER_CORE_INTERNAL_MESSAGE_PAGE_SIZE)
  pageSize?: number;
}
