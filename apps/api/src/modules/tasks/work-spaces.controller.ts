import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators';
import { WorkSpacesService } from './work-spaces.service';

@ApiTags('Work Spaces')
@ApiBearerAuth()
@Controller('tasks/work-spaces')
export class WorkSpacesController {
  constructor(private readonly workSpacesService: WorkSpacesService) {}

  @Get()
  @RequirePermission('TASKS', 'VIEW')
  @ApiOperation({ summary: 'List Work Spaces (paginated)' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'extensionId', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'mode', required: false, description: 'all | scrum | kanban' })
  async findAll(
    @Query('projectId') projectId?: string,
    @Query('productId') productId?: string,
    @Query('extensionId') extensionId?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('mode') mode?: string,
  ) {
    return this.workSpacesService.findAll({
      projectId,
      productId,
      extensionId,
      type,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      search,
      mode,
    });
  }

  @Get('by-product/:productId')
  @RequirePermission('TASKS', 'VIEW')
  @ApiOperation({ summary: 'Get Product Work Space by product ID (read-only)' })
  async findByProduct(@Param('productId') productId: string) {
    return this.workSpacesService.findByProductId(productId);
  }

  @Get(':id')
  @RequirePermission('TASKS', 'VIEW')
  @ApiOperation({ summary: 'Get Work Space by ID' })
  async findOne(@Param('id') id: string) {
    return this.workSpacesService.findById(id);
  }

  @Post()
  @RequirePermission('TASKS', 'ADD')
  @ApiOperation({ summary: 'Create Work Space' })
  async create(
    @Body()
    body: {
      name: string;
      type: string;
      projectId?: string;
      productId?: string;
      extensionId?: string;
      scrumEnabled?: boolean;
      description?: string;
    },
  ) {
    return this.workSpacesService.create(body);
  }

  @Post('product/:productId/ensure')
  @RequirePermission('TASKS', 'ADD')
  @ApiOperation({ summary: 'Ensure connected Product Work Space exists' })
  async ensureProductWorkSpace(@Param('productId') productId: string) {
    return this.workSpacesService.ensureForProduct(productId);
  }

  @Post('extension/:extensionId/ensure')
  @RequirePermission('TASKS', 'ADD')
  @ApiOperation({ summary: 'Ensure parent Product Work Space exists for Extension' })
  async ensureExtensionWorkSpace(@Param('extensionId') extensionId: string) {
    return this.workSpacesService.ensureForExtension(extensionId);
  }

  @Patch(':id')
  @RequirePermission('TASKS', 'EDIT')
  @ApiOperation({ summary: 'Update Work Space metadata' })
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; scrumEnabled?: boolean; description?: string | null },
  ) {
    return this.workSpacesService.update(id, body);
  }
}
