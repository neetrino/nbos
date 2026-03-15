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
import { SupportService } from './support.service';

@ApiTags('Support')
@ApiBearerAuth()
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get()
  @ApiOperation({ summary: 'Get all support tickets with filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'assignedTo', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('category') category?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.supportService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      projectId,
      status,
      priority,
      category,
      assignedTo,
      search,
      sortBy,
      sortOrder,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get support ticket statistics' })
  async getStats() {
    return this.supportService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get support ticket by ID' })
  async findOne(@Param('id') id: string) {
    return this.supportService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create support ticket' })
  async create(
    @Body()
    body: {
      title: string;
      projectId: string;
      category: string;
      description?: string;
      contactId?: string;
      priority?: string;
      billable?: boolean;
      assignedTo?: string;
    },
  ) {
    return this.supportService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update support ticket' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      projectId?: string;
      contactId?: string;
      category?: string;
      priority?: string;
      billable?: boolean;
      assignedTo?: string;
    },
  ) {
    return this.supportService.update(id, body);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update support ticket status' })
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.supportService.updateStatus(id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete support ticket' })
  async remove(@Param('id') id: string) {
    await this.supportService.delete(id);
  }
}
