import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class BindDealWhatsAppGroupDto {
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  groupChatId!: string;

  @IsOptional()
  @IsBoolean()
  persistIfUnreachable?: boolean;
}
