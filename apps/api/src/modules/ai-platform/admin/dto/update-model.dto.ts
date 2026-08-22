import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';
import { AGENT_DESCRIPTION_MAX_LENGTH } from '../../ai-platform.constants';

export class UpdateModelDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  suitabilityTags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(AGENT_DESCRIPTION_MAX_LENGTH)
  notes?: string | null;
}
