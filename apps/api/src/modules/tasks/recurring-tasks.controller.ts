import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators';
import { RecurringTasksService } from './recurring-tasks.service';
import type {
  CreateRecurringTemplateDto,
  UpdateRecurringTemplateDto,
} from './recurring-tasks.types';

@ApiTags('Recurring Tasks')
@ApiBearerAuth()
@Controller('recurring-tasks')
export class RecurringTasksController {
  constructor(private readonly recurringService: RecurringTasksService) {}

  @Get()
  @RequirePermission('TASKS', 'VIEW')
  @ApiOperation({ summary: 'Get all recurring task templates' })
  async findAll(@Query('creatorId') creatorId?: string) {
    return this.recurringService.findAll(creatorId);
  }

  @Post('actions/process-due')
  @RequirePermission('TASKS', 'EDIT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create due recurring task instances' })
  async processDue() {
    return this.recurringService.processDueTemplates();
  }

  @Get(':id')
  @RequirePermission('TASKS', 'VIEW')
  @ApiOperation({ summary: 'Get recurring template by ID' })
  async findOne(@Param('id') id: string) {
    return this.recurringService.findById(id);
  }

  @Post()
  @RequirePermission('TASKS', 'ADD')
  @ApiOperation({ summary: 'Create recurring task template' })
  async create(@Body() body: CreateRecurringTemplateDto) {
    return this.recurringService.create(body);
  }

  @Post(':id/run-now')
  @RequirePermission('TASKS', 'ADD')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create one task from the template now' })
  async runNow(@Param('id') id: string) {
    return this.recurringService.runNow(id);
  }

  @Patch(':id')
  @RequirePermission('TASKS', 'EDIT')
  @ApiOperation({ summary: 'Update recurring template' })
  async update(@Param('id') id: string, @Body() body: UpdateRecurringTemplateDto) {
    return this.recurringService.update(id, body);
  }

  @Delete(':id')
  @RequirePermission('TASKS', 'DELETE')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete recurring template' })
  async remove(@Param('id') id: string) {
    await this.recurringService.delete(id);
  }
}
