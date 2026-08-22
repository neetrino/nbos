import { AI_SCOPE_TYPES } from '@nbos/shared';
import { IsIn, IsISO8601, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { AGENT_GRANT_REASON_MAX_LENGTH } from '../../ai-platform.constants';

export class GrantScopeDto {
  @IsIn(AI_SCOPE_TYPES)
  scopeType!: (typeof AI_SCOPE_TYPES)[number];

  @IsOptional()
  @IsString()
  @MinLength(1)
  scopeId?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  resourceType?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(AGENT_GRANT_REASON_MAX_LENGTH)
  reason?: string | null;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string | null;
}
