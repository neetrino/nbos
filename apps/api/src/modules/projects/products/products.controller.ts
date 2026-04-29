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
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import {
  GENERIC_STATUS_DEPRECATION_DESCRIPTION,
  GENERIC_STATUS_DEPRECATION_HEADER,
} from '../delivery-status-deprecation';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('projects/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all products with filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'productCategory', required: false })
  @ApiQuery({ name: 'productType', required: false })
  @ApiQuery({ name: 'pmId', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('productCategory') productCategory?: string,
    @Query('productType') productType?: string,
    @Query('pmId') pmId?: string,
    @Query('search') search?: string,
  ) {
    return this.productsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      projectId,
      status,
      productCategory,
      productType,
      pmId,
      search,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get product statistics' })
  @ApiQuery({ name: 'projectId', required: false })
  async getStats(@Query('projectId') projectId?: string) {
    return this.productsService.getStats(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create product' })
  async create(
    @Body()
    body: {
      projectId: string;
      name: string;
      productCategory: string;
      productType: string;
      pmId?: string;
      deadline?: string;
      description?: string;
      checklistTemplateId?: string;
    },
  ) {
    return this.productsService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update product' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      productCategory?: string;
      productType?: string;
      pmId?: string | null;
      deadline?: string | null;
      description?: string | null;
      checklistTemplateId?: string | null;
    },
  ) {
    return this.productsService.update(id, body);
  }

  @Patch(':id/status')
  @Header('Deprecation', GENERIC_STATUS_DEPRECATION_HEADER)
  @ApiOperation({
    summary: 'Update product status (deprecated compatibility path)',
    description: GENERIC_STATUS_DEPRECATION_DESCRIPTION,
    deprecated: true,
  })
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.productsService.updateStatus(id, body.status);
  }

  @Patch(':id/stage')
  @ApiOperation({ summary: 'Move product to a canonical delivery stage' })
  async moveStage(@Param('id') id: string, @Body() body: { stage: string }) {
    return this.productsService.moveStage(id, body);
  }

  @Patch(':id/pause')
  @ApiOperation({ summary: 'Pause product delivery with reason and resume date' })
  async pause(@Param('id') id: string, @Body() body: { reason: string; onHoldUntil: string }) {
    return this.productsService.pause(id, body);
  }

  @Patch(':id/resume')
  @ApiOperation({ summary: 'Resume paused product delivery' })
  async resume(@Param('id') id: string) {
    return this.productsService.resume(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel product delivery with reason' })
  async cancel(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.productsService.cancel(id, body);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Complete product delivery' })
  async complete(@Param('id') id: string) {
    return this.productsService.complete(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete product' })
  async remove(@Param('id') id: string) {
    await this.productsService.delete(id);
  }
}
