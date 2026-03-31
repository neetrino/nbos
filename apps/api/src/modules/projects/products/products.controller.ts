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
import { ProductsService } from './products.service';

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
  @ApiQuery({ name: 'productType', required: false })
  @ApiQuery({ name: 'pmId', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('productType') productType?: string,
    @Query('pmId') pmId?: string,
    @Query('search') search?: string,
  ) {
    return this.productsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      projectId,
      status,
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
  @ApiOperation({ summary: 'Update product status (stage gate validation)' })
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.productsService.updateStatus(id, body.status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete product' })
  async remove(@Param('id') id: string) {
    await this.productsService.delete(id);
  }
}
