import { Transform } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';
import { CreateMailOutboundDraftDto } from './create-mail-outbound-draft.dto';

/** New-compose draft: creates a thread + DRAFT message without queueing send. */
export class CreateMailComposeDraftDto extends CreateMailOutboundDraftDto {
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @MinLength(1)
  mailAccountId!: string;
}
