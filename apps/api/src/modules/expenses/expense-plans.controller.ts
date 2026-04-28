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
import { ExpensePlansService } from './expense-plans.service';

@ApiTags('Expense plans')
@ApiBearerAuth()
@Controller('expense-plans')
export class ExpensePlansController {
  constructor(private readonly expensePlansService: ExpensePlansService) {}

  @Get()
  @ApiOperation({ summary: 'List expense plans (paged)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('projectId') projectId?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.expensePlansService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      projectId,
      category,
      search,
      sortBy,
      sortOrder,
    });
  }

  @Post(':id/cards')
  @ApiOperation({
    summary: 'Generate an expense (card) from a plan and advance plan next due when recurring',
  })
  async generateCard(@Param('id') id: string, @Body() body?: { dueDate?: string | null }) {
    return this.expensePlansService.generateCard(id, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense plan by id' })
  async findOne(@Param('id') id: string) {
    return this.expensePlansService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create expense plan' })
  async create(
    @Body()
    body: {
      name: string;
      category: string;
      amount: number;
      frequency?: string;
      nextDueDate?: string | null;
      provider?: string | null;
      projectId?: string | null;
      autoGenerate?: boolean;
      notes?: string | null;
    },
  ) {
    return this.expensePlansService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update expense plan' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      category?: string;
      amount?: number;
      frequency?: string;
      nextDueDate?: string | null;
      provider?: string | null;
      projectId?: string | null;
      autoGenerate?: boolean;
      notes?: string | null;
    },
  ) {
    return this.expensePlansService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete expense plan' })
  async remove(@Param('id') id: string) {
    await this.expensePlansService.delete(id);
  }
}
