import { AI_PROVIDER_TYPES } from '@nbos/shared';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { AGENT_NAME_MAX_LENGTH } from '../../ai-platform.constants';

export class CreateProviderConnectionDto {
  @IsIn(AI_PROVIDER_TYPES)
  provider!: (typeof AI_PROVIDER_TYPES)[number];

  @IsString()
  @MinLength(1)
  @MaxLength(AGENT_NAME_MAX_LENGTH)
  name!: string;

  @IsString()
  @MinLength(1)
  apiKey!: string;

  @IsOptional()
  @IsString()
  @MaxLength(AGENT_NAME_MAX_LENGTH)
  providerOrganizationId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(AGENT_NAME_MAX_LENGTH)
  providerProjectId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  baseUrl?: string | null;
}
