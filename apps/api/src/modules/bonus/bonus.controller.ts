import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { BonusService } from './bonus.service';

@ApiTags('Bonus')
@ApiBearerAuth()
@Controller('bonus')
export class BonusController {
  constructor(private readonly bonusService: BonusService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all bonus entries with filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'orderId', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'type', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('employeeId') employeeId?: string,
    @Query('orderId') orderId?: string,
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.bonusService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      employeeId,
      orderId,
      projectId,
      status,
      type,
      sortBy,
      sortOrder,
    });
  }

  @Get('stats')
  @Public()
  @ApiOperation({ summary: 'Get bonus statistics' })
  async getStats() {
    return this.bonusService.getStats();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get bonus entry by ID' })
  async findOne(@Param('id') id: string) {
    return this.bonusService.findById(id);
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create bonus entry' })
  async create(
    @Body()
    body: {
      employeeId: string;
      orderId: string;
      projectId: string;
      type: string;
      amount: number;
      percent: number;
      status?: string;
      kpiGatePassed?: boolean;
      holdbackPercent?: number;
      holdbackReleaseDate?: string;
      payoutMonth?: string;
    },
  ) {
    return this.bonusService.create(body);
  }

  @Patch(':id/status')
  @Public()
  @ApiOperation({ summary: 'Update bonus entry status' })
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.bonusService.updateStatus(id, status);
  }
}
