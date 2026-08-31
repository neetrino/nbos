import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import {
  MESSENGER_CLIENT_LIST_FILTERS,
  MESSENGER_CLIENT_PROVIDERS,
  MESSENGER_CLIENT_SECTIONS,
  MESSENGER_CORE_CLIENT_LIST_PAGE_SIZE,
} from '../messenger-core.constants';

export class ListClientConversationsQueryDto {
  @IsOptional()
  @IsIn([...MESSENGER_CLIENT_SECTIONS])
  section?: (typeof MESSENGER_CLIENT_SECTIONS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;

  @IsOptional()
  @IsIn([...MESSENGER_CLIENT_LIST_FILTERS])
  filter?: (typeof MESSENGER_CLIENT_LIST_FILTERS)[number];

  @IsOptional()
  @IsIn([...MESSENGER_CLIENT_PROVIDERS])
  provider?: (typeof MESSENGER_CLIENT_PROVIDERS)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MESSENGER_CORE_CLIENT_LIST_PAGE_SIZE)
  pageSize?: number;
}
