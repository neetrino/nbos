import { AI_PROVIDER_TYPES } from '@nbos/shared';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ValidateDraftProviderDto {
  @IsIn(AI_PROVIDER_TYPES)
  provider!: (typeof AI_PROVIDER_TYPES)[number];

  @IsString()
  @MinLength(1)
  apiKey!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  baseUrl?: string | null;
}
