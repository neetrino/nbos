import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
} from 'class-validator';
import { DRIVE_CLEANUP_APPLY_MAX_IDS } from './drive-cleanup.constants';

export class ApplyDriveCleanupDto {
  @IsString()
  kind!: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(DRIVE_CLEANUP_APPLY_MAX_IDS)
  @IsString({ each: true })
  ids?: string[];

  @IsOptional()
  @IsBoolean()
  applyAll?: boolean;
}
