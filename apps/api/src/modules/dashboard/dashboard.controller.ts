import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, type CurrentUserPayload } from '../../common/decorators';
import { CreatePersonalLinkDto } from './dto/create-personal-link.dto';
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

  @Get('personal-links')
  @RequirePermission('DASHBOARDS', 'VIEW')
  @ApiOperation({ summary: 'List current user personal links' })
  listPersonalLinks(@CurrentUser() user: CurrentUserPayload) {
    return this.dashboardService.listPersonalLinks(user.id);
  }

  @Post('personal-links')
  @RequirePermission('DASHBOARDS', 'VIEW')
  @ApiOperation({ summary: 'Create a current user personal link' })
  createPersonalLink(@CurrentUser() user: CurrentUserPayload, @Body() body: CreatePersonalLinkDto) {
    return this.dashboardService.createPersonalLink(user.id, body);
  }

  @Delete('personal-links/:id')
  @RequirePermission('DASHBOARDS', 'VIEW')
  @ApiOperation({ summary: 'Delete a current user personal link' })
  deletePersonalLink(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.dashboardService.deletePersonalLink(user.id, id);
  }
}
