import { IsISO8601, IsOptional } from 'class-validator';

export class RotateCredentialDto {
  @IsOptional()
  @IsISO8601()
  previousValidUntil?: string | null;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string | null;
}
