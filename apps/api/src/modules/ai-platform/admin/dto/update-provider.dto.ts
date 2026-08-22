import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { AGENT_NAME_MAX_LENGTH } from '../../ai-platform.constants';

export class UpdateProviderConnectionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(AGENT_NAME_MAX_LENGTH)
  name?: string;

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
