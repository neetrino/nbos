import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { AutoTasksService } from './auto-tasks.service';

@ApiTags('Automation')
@ApiBearerAuth()
@Controller('automation')
export class AutoTasksController {
  constructor(private readonly autoTasksService: AutoTasksService) {}

  @Post('generate-tasks')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate tasks for a deal based on product type template' })
  async generateTasks(@Body() body: { dealId: string; productType: string; creatorId: string }) {
    return this.autoTasksService.generateTasksForDeal(
      body.dealId,
      body.productType,
      body.creatorId,
    );
  }
}
