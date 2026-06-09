import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export enum MailSecureModeDto {
  SSL = 'SSL',
  STARTTLS = 'STARTTLS',
  NONE = 'NONE',
}

export class ConnectCorporateMailboxDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsString()
  @MinLength(1)
  imapHost!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  imapPort!: number;

  @IsEnum(MailSecureModeDto)
  imapSecure!: MailSecureModeDto;

  @IsString()
  @MinLength(1)
  smtpHost!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  smtpPort!: number;

  @IsEnum(MailSecureModeDto)
  smtpSecure!: MailSecureModeDto;

  @IsString()
  @MinLength(1)
  login!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
