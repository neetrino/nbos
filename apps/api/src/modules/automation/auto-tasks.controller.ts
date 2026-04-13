import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AutoTasksService } from './auto-tasks.service';

@ApiTags('Automation')
@ApiBearerAuth()
@Controller('automation')
export class AutoTasksController {
  constructor(private readonly autoTasksService: AutoTasksService) {}

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
