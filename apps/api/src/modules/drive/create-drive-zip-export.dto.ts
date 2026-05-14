import { ArrayMaxSize, ArrayMinSize, IsArray, IsUUID } from 'class-validator';
import { DRIVE_ZIP_EXPORT_MAX_FILES } from './drive-zip-export.constants';

export class CreateDriveZipExportBodyDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(DRIVE_ZIP_EXPORT_MAX_FILES)
  @IsUUID('4', { each: true })
  fileIds!: string[];
}
