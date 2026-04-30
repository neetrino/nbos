import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, type CurrentUserPayload } from '../../common/decorators';
import { UpdateDashboardPreferenceDto } from './dto/update-dashboard-preference.dto';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('control-center')
  @RequirePermission('DASHBOARDS', 'VIEW')
  @ApiOperation({
    summary: 'Get Dashboard Control Center projection',
    description:
      'Lightweight action-center projection. Dashboard does not own source business data.',
  })
  getControlCenter(@CurrentUser() user: CurrentUserPayload) {
    return this.dashboardService.getControlCenterProjection(user.id);
  }

  @Patch('preferences')
  @RequirePermission('DASHBOARDS', 'VIEW')
  @ApiOperation({ summary: 'Update current user dashboard preferences' })
  updatePreference(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: UpdateDashboardPreferenceDto,
  ) {
    return this.dashboardService.updatePreference(user.id, body);
  }
}
