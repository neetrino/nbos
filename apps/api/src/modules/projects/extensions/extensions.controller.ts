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
import { Public } from '../../../common/decorators';
import { ExtensionsService } from './extensions.service';

@ApiTags('Projects / Extensions')
@ApiBearerAuth()
@Controller('projects')
export class ExtensionsController {
  constructor(private readonly extensionsService: ExtensionsService) {}

  @Get(':projectId/extensions')
  @Public()
  @ApiOperation({ summary: 'Get all extensions for a project' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'productId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'size', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @Param('projectId') projectId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('productId') productId?: string,
    @Query('status') status?: string,
    @Query('size') size?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.extensionsService.findAll({
      projectId,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      productId,
      status,
      size,
      search,
      sortBy,
      sortOrder,
    });
  }

  @Get('extensions/:id')
  @Public()
  @ApiOperation({ summary: 'Get extension by ID' })
  async findOne(@Param('id') id: string) {
    return this.extensionsService.findById(id);
  }

  @Post('extensions')
  @Public()
  @ApiOperation({ summary: 'Create a new extension' })
  async create(
    @Body()
    body: {
      projectId: string;
      productId?: string;
      name: string;
      size?: string;
      assignedTo?: string;
    },
  ) {
    return this.extensionsService.create(body);
  }

  @Put('extensions/:id')
  @Public()
  @ApiOperation({ summary: 'Update extension' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      productId?: string;
      size?: string;
      assignedTo?: string;
    },
  ) {
    return this.extensionsService.update(id, body);
  }

  @Patch('extensions/:id/status')
  @Public()
  @ApiOperation({ summary: 'Update extension status' })
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.extensionsService.updateStatus(id, body.status);
  }

  @Delete('extensions/:id')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete extension' })
  async remove(@Param('id') id: string) {
    await this.extensionsService.delete(id);
  }
}
