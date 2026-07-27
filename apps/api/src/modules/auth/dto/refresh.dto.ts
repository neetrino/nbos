import { IsOptional, IsString, MinLength } from 'class-validator';

export class RefreshDto {
  /** Optional when refresh cookie is present (BFF may send body instead). */
  @IsOptional()
  @IsString()
  @MinLength(8)
  refreshToken?: string;
}
