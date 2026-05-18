import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AutoTasksService } from './auto-tasks.service';
import { AUTOMATION_RULES_CATALOG } from './automation-rules.catalog';
import { TASK_BLUEPRINTS_BY_PRODUCT_TYPE } from './task-blueprints.constants';

@ApiTags('Automation')
@ApiBearerAuth()
@Controller('automation')
export class AutoTasksController {
  constructor(private readonly autoTasksService: AutoTasksService) {}

  @Get('rules-catalog')
  @ApiOperation({ summary: 'List automation rules and blueprint product types (read-only)' })
  getRulesCatalog() {
    return {
      automationRules: AUTOMATION_RULES_CATALOG,
      blueprintProductTypes: Object.keys(TASK_BLUEPRINTS_BY_PRODUCT_TYPE),
    };
  }

  @Post('generate-tasks')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate tasks for a deal based on product type template' })
  async generateTasksForDeal(
    @Body() body: { dealId: string; productType: string; creatorId: string },
  ) {
    return this.autoTasksService.generateTasksForDeal(
      body.dealId,
      body.productType,
      body.creatorId,
    );
  }

  @Post('generate-product-tasks')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate tasks for a product based on its type template' })
  async generateTasksForProduct(
    @Body() body: { productId: string; productType: string; creatorId: string },
  ) {
    return this.autoTasksService.generateTasksForProduct(
      body.productId,
      body.productType,
      body.creatorId,
    );
  }
}
