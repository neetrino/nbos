import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';

@ApiTags('Finance / Invoices')
@ApiBearerAuth()
@Controller('finance/invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all invoices' })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('projectId') projectId?: string,
    @Query('search') search?: string,
  ) {
    return this.invoicesService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      status,
      projectId,
      search,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get invoice statistics' })
  async getStats() {
    return this.invoicesService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  async findOne(@Param('id') id: string) {
    return this.invoicesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create invoice' })
  async create(
    @Body()
    body: {
      orderId?: string;
      subscriptionId?: string;
      projectId: string;
      companyId?: string;
      amount: number;
      type: string;
      dueDate?: string;
    },
  ) {
    return this.invoicesService.create(body);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update invoice status' })
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.invoicesService.updateStatus(id, body.status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete invoice' })
  async remove(@Param('id') id: string) {
    await this.invoicesService.delete(id);
  }
}
