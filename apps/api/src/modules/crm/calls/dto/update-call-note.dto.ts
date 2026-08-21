import { IsOptional, IsString, MaxLength } from 'class-validator';
import { CALL_NOTE_MAX_LENGTH } from '../calls.constants';

export class UpdateCallNoteDto {
  @IsOptional()
  @IsString()
  @MaxLength(CALL_NOTE_MAX_LENGTH)
  note?: string | null;
}
