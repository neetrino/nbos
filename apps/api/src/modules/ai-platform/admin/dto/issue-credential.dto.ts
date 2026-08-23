import { IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';
import { AGENT_CREDENTIAL_LABEL_MAX_LENGTH } from '../../ai-platform.constants';

export class IssueCredentialDto {
  @IsOptional()
  @IsString()
  @MaxLength(AGENT_CREDENTIAL_LABEL_MAX_LENGTH)
  label?: string | null;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string | null;
}
