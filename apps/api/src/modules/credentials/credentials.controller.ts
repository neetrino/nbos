import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../../common/decorators';
import type { CurrentUserPayload } from '../../common/decorators';
import { CredentialsService } from './credentials.service';

function extractUserId(req: Request): string {
  const user = (req as Request & { user?: CurrentUserPayload }).user;
  return user?.clerkUserId ?? 'system';
}

@ApiTags('Credentials')
@ApiBearerAuth()
@Controller('credentials')
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List credentials (sensitive fields masked)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'accessLevel', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('projectId') projectId?: string,
    @Query('category') category?: string,
    @Query('accessLevel') accessLevel?: string,
    @Query('search') search?: string,
  ) {
    return this.credentialsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      projectId,
      category,
      accessLevel,
      search,
    });
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get credential by ID with decrypted fields (audit logged)' })
  async findOne(@Param('id') id: string, @Req() req: Request) {
    return this.credentialsService.findById(id, extractUserId(req));
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create credential' })
  async create(
    @Body()
    body: {
      projectId?: string;
      category: string;
      provider?: string;
      name: string;
      url?: string;
      login?: string;
      password?: string;
      apiKey?: string;
      envData?: string;
      accessLevel?: string;
      allowedEmployees?: string[];
    },
    @Req() req: Request,
  ) {
    return this.credentialsService.create(body, extractUserId(req));
  }

  @Put(':id')
  @Public()
  @ApiOperation({ summary: 'Update credential' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      projectId?: string;
      category?: string;
      provider?: string;
      name?: string;
      url?: string;
      login?: string;
      password?: string;
      apiKey?: string;
      envData?: string;
      accessLevel?: string;
      allowedEmployees?: string[];
    },
    @Req() req: Request,
  ) {
    return this.credentialsService.update(id, body, extractUserId(req));
  }

  @Delete(':id')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete credential' })
  async remove(@Param('id') id: string, @Req() req: Request) {
    await this.credentialsService.delete(id, extractUserId(req));
  }
}
