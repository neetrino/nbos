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
import { ProjectsService } from './projects.service';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all projects with filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'isArchived', required: false, type: Boolean })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('isArchived') isArchived?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.projectsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      search,
      isArchived: isArchived === 'true' ? true : isArchived === 'false' ? false : undefined,
      sortBy,
      sortOrder,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get project statistics' })
  async getStats() {
    return this.projectsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  async findOne(@Param('id') id: string) {
    return this.projectsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create project' })
  async create(
    @Body()
    body: {
      name: string;
      contactId: string;
      description?: string;
      companyId?: string;
    },
  ) {
    return this.projectsService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update project' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      companyId?: string;
      contactId?: string;
      isArchived?: boolean;
    },
  ) {
    return this.projectsService.update(id, body);
  }

  @Put(':id/kickoff-checklist/:itemId')
  @ApiOperation({ summary: 'Update project kickoff checklist item' })
  async updateKickoffChecklistItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() body: { isChecked?: boolean; note?: string | null },
  ) {
    return this.projectsService.updateKickoffChecklistItem(id, itemId, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete project' })
  async remove(@Param('id') id: string) {
    await this.projectsService.delete(id);
  }
}
