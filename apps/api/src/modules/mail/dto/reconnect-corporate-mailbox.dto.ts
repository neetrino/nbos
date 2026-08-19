import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { MailSecureModeDto } from './connect-corporate-mailbox.dto';

/** Partial IMAP/SMTP update. Omitted fields keep the stored values; password may be omitted. */
export class ReconnectCorporateMailboxDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  imapHost?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  imapPort?: number;

  @IsOptional()
  @IsEnum(MailSecureModeDto)
  imapSecure?: MailSecureModeDto;

  @IsOptional()
  @IsString()
  @MinLength(1)
  smtpHost?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  smtpPort?: number;

  @IsOptional()
  @IsEnum(MailSecureModeDto)
  smtpSecure?: MailSecureModeDto;

  @IsOptional()
  @IsString()
  @MinLength(1)
  login?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  password?: string;
}
