import { ArrayMaxSize, IsArray, IsIn, IsOptional } from 'class-validator';
import {
  DASHBOARD_PINNED_ACTION_KEYS,
  DASHBOARD_PINNED_ACTION_MAX_COUNT,
  DASHBOARD_WIDGET_KEYS,
  DASHBOARD_WIDGET_MAX_COUNT,
} from '../dashboard.constants';
import { SIDEBAR_MODULE_KEYS, SIDEBAR_MODULE_MAX_COUNT } from '../sidebar-navigation';

export class UpdateDashboardPreferenceDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(DASHBOARD_PINNED_ACTION_MAX_COUNT)
  @IsIn(DASHBOARD_PINNED_ACTION_KEYS, { each: true })
  pinnedActionOrder?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(DASHBOARD_PINNED_ACTION_MAX_COUNT)
  @IsIn(DASHBOARD_PINNED_ACTION_KEYS, { each: true })
  hiddenPinnedActions?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(DASHBOARD_WIDGET_MAX_COUNT)
  @IsIn(DASHBOARD_WIDGET_KEYS, { each: true })
  visibleWidgets?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(DASHBOARD_WIDGET_MAX_COUNT)
  @IsIn(DASHBOARD_WIDGET_KEYS, { each: true })
  hiddenWidgets?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(DASHBOARD_WIDGET_MAX_COUNT)
  @IsIn(DASHBOARD_WIDGET_KEYS, { each: true })
  compactWidgets?: string[];

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
