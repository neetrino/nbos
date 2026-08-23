import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { AGENT_GRANT_REASON_MAX_LENGTH } from '../../ai-platform.constants';

export class GrantWorkspaceAccessDto {
  @IsString()
  @MinLength(1)
  agentId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(AGENT_GRANT_REASON_MAX_LENGTH)
  reason?: string | null;
}
