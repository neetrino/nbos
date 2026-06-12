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
import { ProjectTeamService } from '../platform-access/project-team.service';
import { CurrentUser, RequirePermission, type CurrentUserPayload } from '../../common/decorators';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly projectTeamService: ProjectTeamService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all projects with filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'isArchived', required: false, type: Boolean, deprecated: true })
  @ApiQuery({ name: 'scope', required: false, enum: ['active', 'trash'] })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('isArchived') isArchived?: string,
    @Query('scope') scope?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.projectsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      search,
      isArchived: isArchived === 'true' ? true : isArchived === 'false' ? false : undefined,
      scope,
      sortBy,
      sortOrder,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get project statistics' })
  async getStats() {
    return this.projectsService.getStats();
  }

  @Get(':id/team')
  @ApiOperation({ summary: 'List project team members (platform access)' })
  async listProjectTeam(@Param('id') id: string) {
    return this.projectTeamService.listByProject(id);
  }

  @Post(':id/team')
  @RequirePermission('PROJECTS', 'EDIT')
  @ApiOperation({ summary: 'Add or update a project team member' })
  async addProjectTeamMember(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: { employeeId: string; role?: 'ADMIN' | 'MEMBER' },
  ) {
    return this.projectTeamService.addMember(id, body, user.id, user.role);
  }

  @Put(':id/team/:employeeId')
  @RequirePermission('PROJECTS', 'EDIT')
  @ApiOperation({ summary: 'Update project team member role' })
  async updateProjectTeamMember(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('employeeId') employeeId: string,
    @Body() body: { role?: 'ADMIN' | 'MEMBER' },
  ) {
    return this.projectTeamService.updateMember(id, employeeId, body, user.id, user.role);
  }

  @Delete(':id/team/:employeeId')
  @RequirePermission('PROJECTS', 'EDIT')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove project team member' })
  async removeProjectTeamMember(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('employeeId') employeeId: string,
  ) {
    await this.projectTeamService.removeMember(id, employeeId, user.id, user.role);
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
      contactIds?: string[];
    },
  ) {
    return this.projectsService.update(id, body);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore project from Trash' })
  async restore(@Param('id') id: string) {
    await this.projectsService.restoreFromTrash(id);
    return this.projectsService.findById(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Move project to Trash' })
  async remove(@Param('id') id: string) {
    await this.projectsService.moveToTrash(id);
  }
}
