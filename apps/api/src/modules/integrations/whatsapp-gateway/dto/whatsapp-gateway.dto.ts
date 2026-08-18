import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpsertWhatsAppGatewayConnectionDto {
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(500)
  baseUrl?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(500)
  apiToken?: string;
}

export class BindProductWhatsAppGroupDto {
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  groupChatId!: string;

  @IsOptional()
  @IsBoolean()
  replace?: boolean;

  /** Won/ID path: persist the id when Gateway/WAHA is unreachable. */
  @IsOptional()
  @IsBoolean()
  persistIfUnreachable?: boolean;
}

export class ResendWhatsAppClientInviteDto {
  @IsOptional()
  @IsBoolean()
  forceResend?: boolean;
}
