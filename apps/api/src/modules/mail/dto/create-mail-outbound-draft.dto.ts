import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
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
  @IsOptional()
  @Transform(({ value }) => trimStringArray(value))
  @IsArray()
  @ArrayMaxSize(MAIL_OUTBOUND_DRAFT_MAX_TO_RECIPIENTS)
  @IsEmail({}, { each: true })
  to?: string[];

  @IsOptional()
  @Transform(({ value }) => trimStringArray(value))
  @IsArray()
  @ArrayMaxSize(MAIL_OUTBOUND_DRAFT_MAX_CC_RECIPIENTS)
  @IsEmail({}, { each: true })
  cc?: string[];

  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @MaxLength(MAIL_OUTBOUND_DRAFT_SUBJECT_MAX_LENGTH)
  subject?: string;

  @IsOptional()
  @Transform(({ value }) => String(value ?? ''))
  @IsString()
  @MaxLength(MAIL_OUTBOUND_DRAFT_BODY_MAX_LENGTH)
  bodyText?: string;

  @IsOptional()
  @Transform(({ value }) => {
    const trimmed = String(value ?? '').trim();
    return trimmed.length > 0 ? trimmed : undefined;
  })
  @IsString()
  @MaxLength(MAIL_OUTBOUND_DRAFT_BODY_MAX_LENGTH)
  bodyHtml?: string;

  @IsOptional()
  @Transform(({ value }) => trimStringArray(value))
  @IsArray()
  @ArrayMaxSize(MAIL_OUTBOUND_DRAFT_MAX_ATTACHMENTS)
  @IsString({ each: true })
  fileAssetIds?: string[];
}
