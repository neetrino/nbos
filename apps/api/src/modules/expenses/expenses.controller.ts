import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';

@ApiTags('Expenses')
@ApiBearerAuth()
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all expenses with filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'frequency', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('projectId') projectId?: string,
    @Query('frequency') frequency?: string,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.expensesService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      type,
      category,
      status,
      projectId,
      frequency,
      search,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get expense statistics' })
  async getStats(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.expensesService.getStats({ dateFrom, dateTo });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense by ID' })
  async findOne(@Param('id') id: string) {
    return this.expensesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create expense' })
  async create(
    @Body()
    body: {
      name: string;
      type: string;
      category: string;
      amount: number;
      frequency?: string;
      dueDate?: string;
      status?: string;
      projectId?: string;
      isPassThrough?: boolean;
      taxStatus?: string;
      notes?: string;
    },
  ) {
    return this.expensesService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update expense' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      type?: string;
      category?: string;
      amount?: number;
      frequency?: string;
      dueDate?: string;
      status?: string;
      projectId?: string;
      isPassThrough?: boolean;
      taxStatus?: string;
      notes?: string;
    },
  ) {
    return this.expensesService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete expense' })
  async remove(@Param('id') id: string) {
    await this.expensesService.delete(id);
  }
}
