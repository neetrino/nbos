import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  MAIL_OUTBOUND_DRAFT_BODY_MAX_LENGTH,
  MAIL_OUTBOUND_DRAFT_MAX_ATTACHMENTS,
  MAIL_OUTBOUND_DRAFT_MAX_CC_RECIPIENTS,
  MAIL_OUTBOUND_DRAFT_MAX_TO_RECIPIENTS,
  MAIL_OUTBOUND_DRAFT_SUBJECT_MAX_LENGTH,
} from '../mail-outbound.constants';

function trimStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((v) => String(v).trim()).filter((s) => s.length > 0);
}

export class CreateMailOutboundDraftDto {
  @Transform(({ value }) => trimStringArray(value))
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAIL_OUTBOUND_DRAFT_MAX_TO_RECIPIENTS)
  @IsEmail({}, { each: true })
  to!: string[];

  @IsOptional()
  @Transform(({ value }) => trimStringArray(value))
  @IsArray()
  @ArrayMaxSize(MAIL_OUTBOUND_DRAFT_MAX_CC_RECIPIENTS)
  @IsEmail({}, { each: true })
  cc?: string[];

  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @MinLength(1)
  @MaxLength(MAIL_OUTBOUND_DRAFT_SUBJECT_MAX_LENGTH)
  subject!: string;

  @Transform(({ value }) => String(value ?? ''))
  @IsString()
  @MaxLength(MAIL_OUTBOUND_DRAFT_BODY_MAX_LENGTH)
  bodyText!: string;

  @IsOptional()
  @Transform(({ value }) => trimStringArray(value))
  @IsArray()
  @ArrayMaxSize(MAIL_OUTBOUND_DRAFT_MAX_ATTACHMENTS)
  @IsString({ each: true })
  fileAssetIds?: string[];
}
