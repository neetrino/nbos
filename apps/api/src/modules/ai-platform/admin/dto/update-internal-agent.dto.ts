import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { AGENT_DESCRIPTION_MAX_LENGTH, AGENT_NAME_MAX_LENGTH } from '../../ai-platform.constants';

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class UpdateInternalAgentDto {
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
  @IsString()
  @MaxLength(AGENT_DESCRIPTION_MAX_LENGTH)
  environment?: string | null;

  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(1)
  modelPolicyId?: string | null;

  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(1)
  promptPolicyId?: string | null;

  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(1)
  approvalPolicyId?: string | null;
}
