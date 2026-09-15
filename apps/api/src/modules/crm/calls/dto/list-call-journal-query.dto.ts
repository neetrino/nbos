import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { CALLS_PAGE_SIZE_MAX } from '../calls.constants';

export class ListCallJournalQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(CALLS_PAGE_SIZE_MAX)
  pageSize?: number;
}
