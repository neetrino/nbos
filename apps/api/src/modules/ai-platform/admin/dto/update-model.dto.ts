import { IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { AI_MODEL_EVALUATION_STATUSES } from '@nbos/shared';
import { AGENT_DESCRIPTION_MAX_LENGTH } from '../../ai-platform.constants';

export class UpdateModelDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  suitabilityTags?: string[];

  @IsOptional()
  @IsIn(AI_MODEL_EVALUATION_STATUSES)
  evaluationStatus?: (typeof AI_MODEL_EVALUATION_STATUSES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(AGENT_DESCRIPTION_MAX_LENGTH)
  notes?: string | null;
}
