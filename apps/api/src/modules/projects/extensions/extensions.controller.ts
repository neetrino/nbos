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
import { ExtensionsService } from './extensions.service';

@ApiTags('Extensions')
@ApiBearerAuth()
@Controller('projects/extensions')
export class ExtensionsController {
  constructor(private readonly extensionsService: ExtensionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all extensions with filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'size', required: false })
  @ApiQuery({ name: 'assignedTo', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('projectId') projectId?: string,
    @Query('productId') productId?: string,
    @Query('status') status?: string,
    @Query('size') size?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('search') search?: string,
  ) {
    return this.extensionsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      projectId,
      productId,
      status,
      size,
      assignedTo,
      search,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get extension statistics' })
  @ApiQuery({ name: 'projectId', required: false })
  async getStats(@Query('projectId') projectId?: string) {
    return this.extensionsService.getStats(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get extension by ID' })
  async findOne(@Param('id') id: string) {
    return this.extensionsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create extension' })
  async create(
    @Body()
    body: {
      projectId: string;
      productId?: string;
      name: string;
      size?: string;
      assignedTo?: string;
      description?: string;
    },
  ) {
    return this.extensionsService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update extension' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      productId?: string | null;
      size?: string;
      assignedTo?: string | null;
      description?: string | null;
    },
  ) {
    return this.extensionsService.update(id, body);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update extension status (stage gate validation)' })
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.extensionsService.updateStatus(id, body.status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete extension' })
  async remove(@Param('id') id: string) {
    await this.extensionsService.delete(id);
  }
}
