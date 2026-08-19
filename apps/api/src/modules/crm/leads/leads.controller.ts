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
import { CurrentUser, type CurrentUserPayload } from '../../../common/decorators';
import { LeadsService } from './leads.service';
import { LeadConversionService } from './lead-conversion.service';
import { FindLeadDuplicatesDto } from './dto/find-lead-duplicates.dto';
import { MergeLeadDto } from './dto/merge-lead.dto';
import { AttachLeadContactDto } from './dto/attach-lead-contact.dto';
import { PourLeadIntoContactDto } from './dto/pour-lead-into-contact.dto';
import { CreateLeadContactDto } from './dto/create-lead-contact.dto';

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
  @ApiQuery({ name: 'scope', required: false, enum: ['active', 'trash'] })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('source') source?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('scope') scope?: string,
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
      scope,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get leads statistics' })
  async getStats() {
    return this.leadsService.getStats();
  }

  @Get('duplicates')
  @ApiOperation({ summary: 'Find duplicate / attach-candidate leads by identity or search' })
  async findDuplicates(@Query() query: FindLeadDuplicatesDto) {
    return this.leadsService.findDuplicates({
      phone: query.phone,
      email: query.email,
      instagramUsername: query.instagramUsername,
      excludeId: query.excludeId,
      search: query.q,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead by ID' })
  async findOne(@Param('id') id: string) {
    return this.leadsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new lead' })
  async create(
    @CurrentUser() user: CurrentUserPayload | undefined,
    @Body()
    body: {
      name: string;
      contactName?: string;
      contactId?: string;
      phone?: string;
      email?: string;
      source?: string | null;
      sourceDetail?: string | null;
      sourcePartnerId?: string | null;
      sourceContactId?: string | null;
      marketingAccountId?: string | null;
      marketingActivityId?: string | null;
      assignedTo?: string;
      notes?: string;
    },
  ) {
    return this.leadsService.create(body, {
      actorId: user?.id,
      actorRoleLevel: user?.roleLevel,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update lead' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload | undefined,
    @Body()
    body: {
      name?: string;
      contactName?: string;
      phone?: string;
      email?: string;
      source?: string | null;
      sourceDetail?: string | null;
      sourcePartnerId?: string | null;
      sourceContactId?: string | null;
      marketingAccountId?: string | null;
      marketingActivityId?: string | null;
      status?: string;
      assignedTo?: string;
      notes?: string;
      contactIds?: string[];
    },
  ) {
    return this.leadsService.update(id, body, { actorRoleLevel: user?.roleLevel });
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update lead status' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload | undefined,
    @Body() body: { status: string },
  ) {
    if (body.status === 'SQL') {
      await this.leadConversionService.qualifyLeadAsSql(id, { actorRoleLevel: user?.roleLevel });
      return this.leadsService.findById(id);
    }

    return this.leadsService.updateStatus(id, body.status);
  }

  @Post(':id/convert')
  @ApiOperation({ summary: 'Convert lead to deal (CRM-03 automation)' })
  async convertToDeal(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload | undefined,
    @Body()
    body: {
      dealType: string;
      amount?: number;
      paymentType?: string;
      sellerId: string;
    },
  ) {
    return this.leadConversionService.convertToDeal(id, body, { actorRoleLevel: user?.roleLevel });
  }

  @Post(':id/merge')
  @ApiOperation({ summary: 'Merge another Lead into this survivor Lead' })
  async merge(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: MergeLeadDto,
  ) {
    return this.leadsService.mergeLeads(
      id,
      { absorbedId: body.absorbedId, fieldChoices: body.fieldChoices, status: body.status },
      { id: user.id, roleSlug: user.role },
    );
  }

  @Post(':id/pour-into-contact')
  @ApiOperation({ summary: 'Pour this Lead onto an existing Contact and trash the Lead' })
  async pourIntoContact(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: PourLeadIntoContactDto,
  ) {
    return this.leadsService.pourIntoContact(id, body.contactId, {
      id: user.id,
      roleSlug: user.role,
    });
  }

  @Post(':id/create-contact')
  @ApiOperation({ summary: 'Create a Contact from this Lead; optionally attach to work and trash' })
  async createContact(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: CreateLeadContactDto,
  ) {
    return this.leadsService.createContactFromLead(
      id,
      { attach: body.attach },
      { id: user.id, roleSlug: user.role },
    );
  }

  @Post(':id/attach-contact')
  @ApiOperation({ summary: 'Attach a stray Lead to an existing Contact (optional open Deal)' })
  async attachContact(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: AttachLeadContactDto,
  ) {
    return this.leadsService.attachContact(
      id,
      { contactId: body.contactId, aboutDealId: body.aboutDealId },
      { id: user.id, roleSlug: user.role },
    );
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore lead from Trash' })
  async restore(@Param('id') id: string) {
    await this.leadsService.restoreFromTrash(id);
    return this.leadsService.findById(id);
  }

  @Delete(':id/permanent')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Permanently delete trashed lead (cannot be undone)' })
  async permanentRemove(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    await this.leadsService.permanentlyDeleteFromTrash(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Move lead to Trash' })
  async remove(@Param('id') id: string) {
    await this.leadsService.moveToTrash(id);
  }
}
