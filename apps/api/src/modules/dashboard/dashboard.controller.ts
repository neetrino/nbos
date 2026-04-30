import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators';
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
  getControlCenter() {
    return this.dashboardService.getControlCenterProjection();
  }
}
