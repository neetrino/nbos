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
import { ProductsService } from './products.service';

@ApiTags('Projects / Products')
@ApiBearerAuth()
@Controller('projects')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get(':projectId/products')
  @Public()
  @ApiOperation({ summary: 'Get all products for a project' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'productType', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @Param('projectId') projectId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('productType') productType?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.productsService.findAll({
      projectId,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      status,
      productType,
      search,
      sortBy,
      sortOrder,
    });
  }

  @Get('products/:id')
  @Public()
  @ApiOperation({ summary: 'Get product by ID' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Post('products')
  @Public()
  @ApiOperation({ summary: 'Create a new product' })
  async create(
    @Body()
    body: {
      projectId: string;
      name: string;
      productType: string;
      pmId?: string;
      deadline?: string;
      checklistTemplateId?: string;
    },
  ) {
    return this.productsService.create(body);
  }

  @Put('products/:id')
  @Public()
  @ApiOperation({ summary: 'Update product' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      productType?: string;
      pmId?: string;
      deadline?: string;
      checklistTemplateId?: string;
    },
  ) {
    return this.productsService.update(id, body);
  }

  @Patch('products/:id/status')
  @Public()
  @ApiOperation({ summary: 'Update product status (stage gate)' })
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.productsService.updateStatus(id, body.status);
  }

  @Delete('products/:id')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete product' })
  async remove(@Param('id') id: string) {
    await this.productsService.delete(id);
  }
}
