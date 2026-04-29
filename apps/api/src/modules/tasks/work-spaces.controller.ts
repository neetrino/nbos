import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { WorkSpacesService } from './work-spaces.service';

@ApiTags('Work Spaces')
@ApiBearerAuth()
@Controller('tasks/work-spaces')
export class WorkSpacesController {
  constructor(private readonly workSpacesService: WorkSpacesService) {}

  @Get()
  @ApiOperation({ summary: 'List Work Spaces' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'extensionId', required: false })
  @ApiQuery({ name: 'type', required: false })
  async findAll(
    @Query('projectId') projectId?: string,
    @Query('productId') productId?: string,
    @Query('extensionId') extensionId?: string,
    @Query('type') type?: string,
  ) {
    return this.workSpacesService.findAll({ projectId, productId, extensionId, type });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Work Space by ID' })
  async findOne(@Param('id') id: string) {
    return this.workSpacesService.findById(id);
  }

  @Post()
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
  @ApiOperation({ summary: 'Ensure connected Product Work Space exists' })
  async ensureProductWorkSpace(@Param('productId') productId: string) {
    return this.workSpacesService.ensureForProduct(productId);
  }

  @Post('extension/:extensionId/ensure')
  @ApiOperation({ summary: 'Ensure connected Extension Work Space exists' })
  async ensureExtensionWorkSpace(@Param('extensionId') extensionId: string) {
    return this.workSpacesService.ensureForExtension(extensionId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update Work Space metadata' })
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; scrumEnabled?: boolean; description?: string | null },
  ) {
    return this.workSpacesService.update(id, body);
  }
}
