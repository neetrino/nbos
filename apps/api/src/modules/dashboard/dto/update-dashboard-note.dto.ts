import { IsString, MaxLength } from 'class-validator';
import { DASHBOARD_NOTE_MAX_LENGTH } from '../dashboard-note.constants';

export class UpdateDashboardNoteDto {
  @IsString()
  @MaxLength(DASHBOARD_NOTE_MAX_LENGTH)
  content!: string;
}
