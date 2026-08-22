import { IsISO8601, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { AGENT_DESCRIPTION_MAX_LENGTH, AGENT_NAME_MAX_LENGTH } from '../../ai-platform.constants';

export class UpdateExternalAgentDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(AGENT_NAME_MAX_LENGTH)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(AGENT_DESCRIPTION_MAX_LENGTH)
  description?: string | null;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string | null;
}
