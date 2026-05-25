import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { DRIVE_ZIP_EXPORT_MAX_FILES } from './drive-zip-export.constants';

export class CreateDriveZipExportBodyDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(DRIVE_ZIP_EXPORT_MAX_FILES)
  @IsUUID('4', { each: true })
  fileIds?: string[];

  @IsOptional()
  @IsString()
  exportKind?: string;

  @IsOptional()
  @IsObject()
  exportParams?: Record<string, unknown>;
}
