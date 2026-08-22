import { Type } from 'class-transformer';
import { AI_MODEL_POLICY_CANDIDATE_ROLES, AI_MODEL_POLICY_PHASE1_MODES } from '@nbos/shared';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { AGENT_DESCRIPTION_MAX_LENGTH, AGENT_NAME_MAX_LENGTH } from '../../ai-platform.constants';

export class PolicyCandidateDto {
  @IsString()
  @MinLength(1)
  modelId!: string;

  @IsIn(AI_MODEL_POLICY_CANDIDATE_ROLES)
  role!: (typeof AI_MODEL_POLICY_CANDIDATE_ROLES)[number];

  @IsInt()
  @Min(0)
  priority!: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class CreateModelPolicyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(AGENT_NAME_MAX_LENGTH)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(AGENT_DESCRIPTION_MAX_LENGTH)
  purpose?: string | null;

  @IsIn(AI_MODEL_POLICY_PHASE1_MODES)
  mode!: (typeof AI_MODEL_POLICY_PHASE1_MODES)[number];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PolicyCandidateDto)
  candidates!: PolicyCandidateDto[];
}

export class ReplacePolicyCandidatesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PolicyCandidateDto)
  candidates!: PolicyCandidateDto[];
}
