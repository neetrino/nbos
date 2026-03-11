import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { ProjectsService } from './projects.service';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all projects with filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'pmId', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('type') type?: string,
    @Query('pmId') pmId?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.projectsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      type,
      pmId,
      search,
      sortBy,
      sortOrder,
    });
  }

  @Get('stats')
  @Public()
  @ApiOperation({ summary: 'Get project statistics' })
  async getStats() {
    return this.projectsService.getStats();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get project by ID' })
  async findOne(@Param('id') id: string) {
    return this.projectsService.findById(id);
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create project' })
  async create(
    @Body()
    body: {
      name: string;
      contactId: string;
      description?: string;
      companyId?: string;
      type?: string;
      sellerId?: string;
      pmId?: string;
      deadline?: string;
    },
  ) {
    return this.projectsService.create(body);
  }

  @Put(':id')
  @Public()
  @ApiOperation({ summary: 'Update project' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      companyId?: string;
      contactId?: string;
      type?: string;
      sellerId?: string;
      pmId?: string;
      deadline?: string;
      isArchived?: boolean;
    },
  ) {
    return this.projectsService.update(id, body);
  }

  @Delete(':id')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete project' })
  async remove(@Param('id') id: string) {
    await this.projectsService.delete(id);
  }
}
