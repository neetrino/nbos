import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateDealStatusDto {
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  status!: string;

  @IsOptional()
  @IsIn(['create', 'bind'])
  whatsappAction?: 'create' | 'bind';

  @IsOptional()
  @IsString()
  @MaxLength(128)
  whatsappGroupChatId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  overrideReason?: string;
}
