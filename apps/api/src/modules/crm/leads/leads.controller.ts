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
import { LeadsService } from './leads.service';
import { LeadConversionService } from './lead-conversion.service';

@ApiTags('CRM / Leads')
@ApiBearerAuth()
@Controller('crm/leads')
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly leadConversionService: LeadConversionService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all leads with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'source', required: false, type: String })
  @ApiQuery({ name: 'assignedTo', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('source') source?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.leadsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      status,
      source,
      assignedTo,
      search,
      sortBy,
      sortOrder,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get leads statistics' })
  async getStats() {
    return this.leadsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead by ID' })
  async findOne(@Param('id') id: string) {
    return this.leadsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new lead' })
  async create(
    @Body()
    body: {
      name?: string;
      contactName: string;
      phone?: string;
      email?: string;
      source: string;
      assignedTo?: string;
      notes?: string;
    },
  ) {
    return this.leadsService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update lead' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      contactName?: string;
      phone?: string;
      email?: string;
      source?: string;
      status?: string;
      assignedTo?: string;
      notes?: string;
    },
  ) {
    return this.leadsService.update(id, body);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update lead status' })
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.leadsService.updateStatus(id, body.status);
  }

  @Post(':id/convert')
  @ApiOperation({ summary: 'Convert lead to deal (CRM-03 automation)' })
  async convertToDeal(
    @Param('id') id: string,
    @Body()
    body: {
      dealType: string;
      amount?: number;
      paymentType?: string;
      sellerId: string;
    },
  ) {
    return this.leadConversionService.convertToDeal(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete lead' })
  async remove(@Param('id') id: string) {
    await this.leadsService.delete(id);
  }
}
