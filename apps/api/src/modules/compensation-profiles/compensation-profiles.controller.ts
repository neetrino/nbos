import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, type CurrentUserPayload } from '../../common/decorators';
import { FINANCE_SALARY_MODULE, bindAuthenticatedApprover } from './finance-pay-access';
import { CompensationProfilesService } from './compensation-profiles.service';
import type {
  CreateCompensationProfileBody,
  PatchCompensationProfileDraftBody,
} from './compensation-profiles.types';

@ApiTags('Compensation Profiles')
@ApiBearerAuth()
@Controller()
export class CompensationProfilesController {
  constructor(private readonly service: CompensationProfilesService) {}

  @Get('employees/:employeeId/compensation-profiles')
  @RequirePermission(FINANCE_SALARY_MODULE, 'VIEW')
  @ApiOperation({ summary: 'List compensation profile versions for an employee' })
  listForEmployee(
    @CurrentUser() user: CurrentUserPayload,
    @Param('employeeId') employeeId: string,
  ) {
    return this.service.listForEmployee(user, employeeId);
  }

  @Post('employees/:employeeId/compensation-profiles')
  @RequirePermission(FINANCE_SALARY_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Create a draft compensation profile version' })
  createDraft(
    @CurrentUser() user: CurrentUserPayload,
    @Param('employeeId') employeeId: string,
    @Body() body: CreateCompensationProfileBody,
  ) {
    return this.service.createDraft(user, employeeId, body);
  }

  @Patch('compensation-profiles/:id')
  @RequirePermission(FINANCE_SALARY_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Update a DRAFT compensation profile (e.g. KPI policy)' })
  patchDraft(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: PatchCompensationProfileDraftBody,
  ) {
    return this.service.patchDraft(user, id, body);
  }

  @Post('compensation-profiles/:id/activate')
  @RequirePermission(FINANCE_SALARY_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Activate profile and archive prior active versions' })
  activate(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: { approvedById?: string },
  ) {
    return this.service.activate(user, id, {
      approvedById: bindAuthenticatedApprover(user.id, body?.approvedById),
    });
  }

  @Get('compensation-profile-summaries')
  @RequirePermission(FINANCE_SALARY_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Active minimum salary and bonus/KPI rules per employee' })
  listActive(@CurrentUser() user: CurrentUserPayload) {
    return this.service.listActiveSummaries(user);
  }

  @Get('compensation-profiles/:id')
  @RequirePermission(FINANCE_SALARY_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Get compensation profile by id' })
  findById(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.service.findById(user, id);
  }
}
