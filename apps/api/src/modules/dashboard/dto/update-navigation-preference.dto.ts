import { ArrayMaxSize, IsArray, IsIn, IsOptional } from 'class-validator';
import { SIDEBAR_MODULE_KEYS, SIDEBAR_MODULE_MAX_COUNT } from '../sidebar-navigation';

export class UpdateNavigationPreferenceDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(SIDEBAR_MODULE_MAX_COUNT)
  @IsIn(SIDEBAR_MODULE_KEYS, { each: true })
  sidebarModuleOrder?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(SIDEBAR_MODULE_MAX_COUNT)
  @IsIn(SIDEBAR_MODULE_KEYS, { each: true })
  hiddenSidebarModules?: string[];
}
