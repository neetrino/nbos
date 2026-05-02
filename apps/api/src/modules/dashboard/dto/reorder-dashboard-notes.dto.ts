import { ArrayMaxSize, IsArray, IsString } from 'class-validator';
import { DASHBOARD_NOTE_LIMIT } from '../dashboard-note.constants';

export class ReorderDashboardNotesDto {
  @IsArray()
  @ArrayMaxSize(DASHBOARD_NOTE_LIMIT)
  @IsString({ each: true })
  noteIds!: string[];
}
