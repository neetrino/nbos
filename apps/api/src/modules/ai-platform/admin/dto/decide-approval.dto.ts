import { IsOptional, IsString, MaxLength } from 'class-validator';
import { AI_APPROVAL_REASON_MAX_CHARS } from '@nbos/shared';

export class DecideApprovalDto {
  @IsOptional()
  @IsString()
  @MaxLength(AI_APPROVAL_REASON_MAX_CHARS)
  reason?: string | null;
}
