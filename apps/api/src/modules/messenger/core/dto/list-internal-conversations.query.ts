import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import {
  MESSENGER_CORE_INTERNAL_LIST_PAGE_SIZE,
  MESSENGER_INTERNAL_SECTIONS,
} from '../messenger-core.constants';

export class ListInternalConversationsQueryDto {
  @IsOptional()
  @IsIn([...MESSENGER_INTERNAL_SECTIONS])
  section?: (typeof MESSENGER_INTERNAL_SECTIONS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;

  @IsOptional()
  @IsIn(['unread', 'mentions'])
  filter?: 'unread' | 'mentions';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MESSENGER_CORE_INTERNAL_LIST_PAGE_SIZE)
  pageSize?: number;
}
