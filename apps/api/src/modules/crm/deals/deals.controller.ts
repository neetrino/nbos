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
import { DealsService } from './deals.service';

@ApiTags('CRM / Deals')
@ApiBearerAuth()
@Controller('crm/deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all deals with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'sellerId', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('sellerId') sellerId?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.dealsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      status,
      type,
      sellerId,
      search,
      sortBy,
      sortOrder,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get deals statistics' })
  async getStats() {
    return this.dealsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get deal by ID' })
  async findOne(@Param('id') id: string) {
    return this.dealsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new deal' })
  async create(
    @Body()
    body: {
      name?: string;
      leadId?: string;
      contactId: string;
      type: string;
      amount?: number;
      paymentType?: string;
      taxStatus?: string;
      companyId?: string | null;
      sellerId: string;
      projectId?: string;
      source?: string;
      notes?: string;
    },
  ) {
    return this.dealsService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update deal' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      status?: string;
      type?: string;
      amount?: number;
      paymentType?: string;
      taxStatus?: string;
      companyId?: string | null;
      contactId?: string;
      projectId?: string | null;
      source?: string;
      sourceDetail?: string | null;
      sourcePartnerId?: string | null;
      sourceContactId?: string | null;
      notes?: string;
    },
  ) {
    return this.dealsService.update(id, body);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update deal status (pipeline move)' })
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.dealsService.updateStatus(id, body.status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete deal' })
  async remove(@Param('id') id: string) {
    await this.dealsService.delete(id);
  }
}
