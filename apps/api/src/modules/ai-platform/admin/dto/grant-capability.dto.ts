import { IsISO8601, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { AGENT_GRANT_REASON_MAX_LENGTH } from '../../ai-platform.constants';

export class GrantCapabilityDto {
  @IsString()
  @MinLength(1)
  capabilityKey!: string;

  @IsOptional()
  @IsString()
  @MaxLength(AGENT_GRANT_REASON_MAX_LENGTH)
  reason?: string | null;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string | null;
}
