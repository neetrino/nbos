import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';
import {
  SRC_LOOKUP_QUERY_MAX_LENGTH,
  SRC_LOOKUP_QUERY_MIN_LENGTH,
} from '../armenia-lookup/armenia-company-lookup.constants';

export class LookupCompanyQueryDto {
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(SRC_LOOKUP_QUERY_MIN_LENGTH)
  @MaxLength(SRC_LOOKUP_QUERY_MAX_LENGTH)
  q!: string;
}
