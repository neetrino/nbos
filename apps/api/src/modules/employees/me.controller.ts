import {
  Controller,
  Get,
  Put,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { PrismaClient } from '@nbos/database';
import { CurrentUser, type CurrentUserPayload } from '../../common/decorators';
import { PRISMA_TOKEN } from '../../database.module';
import { EmployeeWalletService } from './employee-wallet.service';
import { EmployeesService } from './employees.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { UpdateNavigationPreferenceDto } from '../dashboard/dto/update-navigation-preference.dto';
import { CreatePersonalLinkDto } from '../dashboard/dto/create-personal-link.dto';

interface UpdateProfileBody {
  phone?: string;
  telegram?: string;
  avatar?: string;
  birthday?: string | null;
}

@ApiTags('Me')
@ApiBearerAuth()
@Controller('me')
export class MeController {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly employeeWalletService: EmployeeWalletService,
    private readonly employeesService: EmployeesService,
    private readonly dashboardService: DashboardService,
  ) {}

  @Get('wallet')
  @ApiOperation({
    summary: 'Read-only employee wallet (base pay, bonus pipeline, payroll salary lines)',
    description:
      'Salary history rows include payrollRunId for linking to Finance payroll run detail.',
  })
  async getWallet(@CurrentUser() user: CurrentUserPayload) {
    if (!user?.id) {
      throw new NotFoundException('Employee record not found for this user');
    }
    return this.employeeWalletService.getWallet(user.id);
  }

  @Get('wallet/salary-lines/:salaryLineId/month-detail')
  @ApiOperation({
    summary: 'Read-only employee month compensation (wallet)',
    description:
      'Same payload as Finance GET /payroll-runs/salary-lines/:id/month-detail, scoped to the current employee only.',
  })
  async getWalletSalaryLineMonthDetail(
    @CurrentUser() user: CurrentUserPayload,
    @Param('salaryLineId') salaryLineId: string,
  ) {
    if (!user?.id) {
      throw new NotFoundException('Employee record not found for this user');
    }
    return this.employeeWalletService.getSalaryLineMonthDetail(user.id, salaryLineId);
  }

  @Get('navigation')
  @ApiOperation({
    summary: 'Get sidebar navigation preferences and personal links for current user',
  })
  getNavigation(@CurrentUser() user: CurrentUserPayload) {
    if (!user?.id) {
      throw new NotFoundException('Employee record not found for this user');
    }
    return this.dashboardService.getNavigationShell(user.id);
  }

  @Patch('navigation')
  @ApiOperation({ summary: 'Update sidebar module order and hidden modules for current user' })
  updateNavigation(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: UpdateNavigationPreferenceDto,
  ) {
    if (!user?.id) {
      throw new NotFoundException('Employee record not found for this user');
    }
    return this.dashboardService.updateNavigationPreference(user.id, body);
  }

  @Post('personal-links')
  @ApiOperation({ summary: 'Create a personal link for current user (sidebar / dashboard)' })
  createPersonalLink(@CurrentUser() user: CurrentUserPayload, @Body() body: CreatePersonalLinkDto) {
    if (!user?.id) {
      throw new NotFoundException('Employee record not found for this user');
    }
    return this.dashboardService.createPersonalLink(user.id, body);
  }

  @Delete('personal-links/:id')
  @ApiOperation({ summary: 'Delete a personal link for current user' })
  deletePersonalLink(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    if (!user?.id) {
      throw new NotFoundException('Employee record not found for this user');
    }
    return this.dashboardService.deletePersonalLink(user.id, id);
  }

  @Get('employee')
  @ApiOperation({
    summary: 'Get current employee full record (same shape as GET /employees/:id)',
  })
  async getEmployee(@CurrentUser() user: CurrentUserPayload) {
    if (!user?.id) {
      throw new NotFoundException('Employee record not found for this user');
    }
    return this.employeesService.findById(user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get current employee profile with role, permissions, and departments' })
  async getMe(@CurrentUser() user: CurrentUserPayload) {
    if (!user?.id || !user.meProfile) {
      throw new NotFoundException('Employee record not found for this user');
    }

    return {
      ...user.meProfile,
      permissions: user.permissions ?? {},
    };
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update own profile (phone, telegram, avatar, birthday)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        phone: { type: 'string', nullable: true },
        telegram: { type: 'string', nullable: true },
        avatar: { type: 'string', nullable: true },
        birthday: { type: 'string', format: 'date-time', nullable: true },
      },
    },
  })
  async updateProfile(@CurrentUser() user: CurrentUserPayload, @Body() body: UpdateProfileBody) {
    const data: { phone?: string; telegram?: string; avatar?: string; birthday?: Date | null } = {};
    if (body.phone !== undefined) data.phone = body.phone;
    if (body.telegram !== undefined) data.telegram = body.telegram;
    if (body.avatar !== undefined) data.avatar = body.avatar;
    if (body.birthday !== undefined) {
      data.birthday = body.birthday ? new Date(body.birthday) : null;
    }

    return this.prisma.employee.update({
      where: { id: user.id },
      data,
      include: {
        role: { select: { id: true, name: true, slug: true, level: true } },
        departments: {
          include: { department: { select: { id: true, name: true, slug: true } } },
        },
      },
    });
  }
}
