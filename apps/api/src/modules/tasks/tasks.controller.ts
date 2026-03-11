import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { TasksService } from './tasks.service';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all tasks with filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'assigneeId', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('projectId') projectId?: string,
    @Query('productId') productId?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.tasksService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      projectId,
      productId,
      status,
      priority,
      assigneeId,
      search,
      sortBy,
      sortOrder,
    });
  }

  @Get('stats')
  @Public()
  @ApiOperation({ summary: 'Get task statistics' })
  async getStats() {
    return this.tasksService.getStats();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get task by ID' })
  async findOne(@Param('id') id: string) {
    return this.tasksService.findById(id);
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create task' })
  async create(
    @Body()
    body: {
      title: string;
      projectId: string;
      creatorId: string;
      description?: string;
      productId?: string;
      extensionId?: string;
      assigneeId?: string;
      coAssignees?: string[];
      observers?: string[];
      priority?: string;
      sprintId?: string;
      dueDate?: string;
    },
  ) {
    return this.tasksService.create(body);
  }

  @Put(':id')
  @Public()
  @ApiOperation({ summary: 'Update task' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      projectId?: string;
      productId?: string;
      extensionId?: string;
      assigneeId?: string;
      coAssignees?: string[];
      observers?: string[];
      priority?: string;
      sprintId?: string;
      dueDate?: string;
    },
  ) {
    return this.tasksService.update(id, body);
  }

  @Patch(':id/status')
  @Public()
  @ApiOperation({ summary: 'Update task status' })
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.tasksService.updateStatus(id, status);
  }

  @Delete(':id')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete task' })
  async remove(@Param('id') id: string) {
    await this.tasksService.delete(id);
  }
}
