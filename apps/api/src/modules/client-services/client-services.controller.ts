import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ClientServicesService } from './client-services.service';
import type {
  ClientServiceRecordBody,
  UpdateClientServiceRecordBody,
} from './client-services.types';

@ApiTags('Client services')
@ApiBearerAuth()
@Controller('client-services')
export class ClientServicesController {
  constructor(private readonly clientServicesService: ClientServicesService) {}

  @Get()
  @ApiOperation({ summary: 'List client service records (paged)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'billingModel', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'renewalFrom', required: false })
  @ApiQuery({ name: 'renewalTo', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('projectId') projectId?: string,
    @Query('productId') productId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('billingModel') billingModel?: string,
    @Query('search') search?: string,
    @Query('renewalFrom') renewalFrom?: string,
    @Query('renewalTo') renewalTo?: string,
  ) {
    return this.clientServicesService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      projectId,
      productId,
      type,
      status,
      billingModel,
      search,
      renewalFrom,
      renewalTo,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get client service scope statistics' })
  async getStats(
    @Query('projectId') projectId?: string,
    @Query('productId') productId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('billingModel') billingModel?: string,
  ) {
    return this.clientServicesService.getStats({
      projectId,
      productId,
      type,
      status,
      billingModel,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client service record by id' })
  async findOne(@Param('id') id: string) {
    return this.clientServicesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create client service record' })
  async create(@Body() body: ClientServiceRecordBody) {
    return this.clientServicesService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update client service record' })
  async update(@Param('id') id: string, @Body() body: UpdateClientServiceRecordBody) {
    return this.clientServicesService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete client service record' })
  async remove(@Param('id') id: string) {
    await this.clientServicesService.delete(id);
  }
}
