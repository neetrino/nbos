import { Type } from 'class-transformer';
import { PROMPT_LAYER_MAX_CHARS } from '@nbos/shared';
import {
  IsDefined,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { AGENT_DESCRIPTION_MAX_LENGTH, AGENT_NAME_MAX_LENGTH } from '../../ai-platform.constants';

export class PromptLayersDto {
  @IsString()
  @MinLength(1)
  @MaxLength(PROMPT_LAYER_MAX_CHARS)
  platformSafety!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(PROMPT_LAYER_MAX_CHARS)
  agentRole!: string;

  @IsOptional()
  @IsString()
  @MaxLength(PROMPT_LAYER_MAX_CHARS)
  domainRules?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(PROMPT_LAYER_MAX_CHARS)
  channelBehavior?: string | null;
}

export class CreatePromptPolicyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(AGENT_NAME_MAX_LENGTH)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(AGENT_DESCRIPTION_MAX_LENGTH)
  purpose?: string | null;

  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => PromptLayersDto)
  layers!: PromptLayersDto;
}

export class CreatePromptVersionDto {
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => PromptLayersDto)
  layers!: PromptLayersDto;
}

export class RollbackPromptPolicyDto {
  @IsString()
  @MinLength(1)
  versionId!: string;
}
