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
import { PartnersService } from './partners.service';

@ApiTags('Partners')
@ApiBearerAuth()
@Controller('partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all partners with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({
    name: 'level',
    required: false,
    type: String,
    description: 'Partner tier: REGULAR | PREMIUM (Prisma `Partner.type`).',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    type: String,
    description: 'Deprecated: use `level`. Same semantics as `level`.',
  })
  @ApiQuery({ name: 'direction', required: false, type: String })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('level') level?: string,
    @Query('type') type?: string,
    @Query('direction') direction?: string,
  ) {
    return this.partnersService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      search,
      status,
      level,
      type,
      direction,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get partners statistics' })
  async getStats() {
    return this.partnersService.getStats();
  }

  @Get(':id/commission-policy')
  @ApiOperation({
    summary: 'Partner commission policy by deal type',
    description:
      'Returns all four deal types. `percent` is null when the partner falls back to `fallbackPercent` (`Partner.defaultPercent`).',
  })
  async getCommissionPolicy(@Param('id') id: string) {
    return this.partnersService.getCommissionPolicy(id);
  }

  @Put(':id/commission-policy')
  @ApiOperation({
    summary: 'Replace partner commission policy rows',
    description:
      'Body must include all four deal types. Set `percent` to null to clear the override for that type (use partner default).',
  })
  async putCommissionPolicy(
    @Param('id') id: string,
    @Body() body: { rows: Array<{ dealType: string; percent: number | null }> },
  ) {
    return this.partnersService.putCommissionPolicy(id, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get partner by ID' })
  async findOne(@Param('id') id: string) {
    return this.partnersService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new partner' })
  async create(
    @Body()
    body: {
      name: string;
      level?: string;
      /** @deprecated Use `level`. */
      type?: string;
      direction?: string;
      defaultPercent?: number;
      status?: string;
      contactId?: string;
    },
  ) {
    return this.partnersService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update partner' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      level?: string;
      /** @deprecated Use `level`. */
      type?: string;
      direction?: string;
      defaultPercent?: number;
      status?: string;
      contactId?: string;
    },
  ) {
    return this.partnersService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete partner' })
  async remove(@Param('id') id: string) {
    await this.partnersService.delete(id);
  }
}
