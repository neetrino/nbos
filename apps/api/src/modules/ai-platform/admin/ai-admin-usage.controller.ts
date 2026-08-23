import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import {
  AI_BUDGET_BEHAVIORS,
  AI_BUDGET_METRICS,
  AI_BUDGET_PERIODS,
  AI_BUDGET_SCOPE_TYPES,
} from '@nbos/shared';
import {
  CurrentUser,
  type CurrentUserPayload,
  RequirePermission,
} from '../../../common/decorators';
import { AGENT_NAME_MAX_LENGTH } from '../ai-platform.constants';
import { AiBudgetLimitService } from '../observability/ai-budget-limit.service';
import { AiExecutionService } from '../observability/ai-execution.service';
import {
  AI_ADMIN_PERMISSION_ACTION,
  AI_ADMIN_PERMISSION_MODULE,
  AI_ADMIN_ROUTE_PREFIX,
} from './ai-admin.constants';

class CreateBudgetLimitDto {
  @IsString()
  @MinLength(1)
  @MaxLength(AGENT_NAME_MAX_LENGTH)
  name!: string;

  @IsIn(AI_BUDGET_SCOPE_TYPES)
  scopeType!: (typeof AI_BUDGET_SCOPE_TYPES)[number];

  @IsString()
  @MinLength(1)
  scopeId!: string;

  @IsIn(AI_BUDGET_METRICS)
  metric!: (typeof AI_BUDGET_METRICS)[number];

  @IsIn(AI_BUDGET_PERIODS)
  period!: (typeof AI_BUDGET_PERIODS)[number];

  @IsString()
  @MinLength(1)
  ceiling!: string;

  @IsOptional()
  @IsString()
  currency?: string | null;

  @IsIn(AI_BUDGET_BEHAVIORS)
  behavior!: (typeof AI_BUDGET_BEHAVIORS)[number];
}

@ApiTags('AI Admin')
@ApiBearerAuth()
@RequirePermission(AI_ADMIN_PERMISSION_MODULE, AI_ADMIN_PERMISSION_ACTION)
@Controller(`${AI_ADMIN_ROUTE_PREFIX}/usage`)
export class AiAdminUsageController {
  constructor(
    private readonly executions: AiExecutionService,
    private readonly budgets: AiBudgetLimitService,
  ) {}

  @Get('executions')
  @ApiOperation({ summary: 'Recent AI execution/usage records' })
  listExecutions() {
    return this.executions.listRecent();
  }

  @Get('budgets')
  @ApiOperation({ summary: 'Enabled AI budget/usage limits' })
  listBudgets() {
    return this.budgets.listEnabled();
  }

  @Post('budgets')
  @ApiOperation({ summary: 'Create an AI budget/usage limit' })
  createBudget(@CurrentUser() user: CurrentUserPayload, @Body() body: CreateBudgetLimitDto) {
    return this.budgets.create(body, user.id);
  }
}
