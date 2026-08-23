import { IsInt, IsString, MaxLength, Min, ValidateIf } from 'class-validator';
import { CALL_NOTE_MAX_LENGTH } from '../calls.constants';

export class UpdateCallNoteDto {
  /** Required; `null` clears the note. Omitted `note` must not pass validation. */
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @MaxLength(CALL_NOTE_MAX_LENGTH)
  note!: string | null;

  @IsInt()
  @Min(0)
  expectedNoteVersion!: number;
}
