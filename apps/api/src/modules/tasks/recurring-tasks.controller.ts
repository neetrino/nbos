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
import { Public } from '../../common/decorators';
import { RecurringTasksService } from './recurring-tasks.service';

@ApiTags('Recurring Tasks')
@ApiBearerAuth()
@Controller('recurring-tasks')
export class RecurringTasksController {
  constructor(private readonly recurringService: RecurringTasksService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all recurring task templates' })
  async findAll(@Query('creatorId') creatorId?: string) {
    return this.recurringService.findAll(creatorId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get recurring template by ID' })
  async findOne(@Param('id') id: string) {
    return this.recurringService.findById(id);
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create recurring task template' })
  async create(
    @Body()
    body: {
      title: string;
      creatorId: string;
      description?: string;
      assigneeId?: string;
      priority?: string;
      frequency: string;
      interval?: number;
      daysOfWeek?: string[];
      dayOfMonth?: number;
      startDate: string;
      endDate?: string;
      dueDateOffset?: number;
      checklistData?: unknown;
      linksData?: unknown;
    },
  ) {
    return this.recurringService.create(body);
  }

  @Patch(':id')
  @Public()
  @ApiOperation({ summary: 'Update recurring template' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      assigneeId?: string | null;
      priority?: string;
      frequency?: string;
      interval?: number;
      daysOfWeek?: string[];
      dayOfMonth?: number;
      startDate?: string;
      endDate?: string | null;
      dueDateOffset?: number | null;
      isActive?: boolean;
      checklistData?: unknown;
      linksData?: unknown;
    },
  ) {
    return this.recurringService.update(id, body);
  }

  @Delete(':id')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete recurring template' })
  async remove(@Param('id') id: string) {
    await this.recurringService.delete(id);
  }
}
