import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  PrismaClient,
  type ClientServiceBillingModel,
  type ClientServiceType,
  type ExpenseFrequency,
  type TaxStatus,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { InvoicesService } from '../finance/invoices/invoices.service';
import { ExpensePlansService } from '../expenses/expense-plans.service';
import { ExpensesService } from '../expenses/expenses.service';
import { TasksService } from '../tasks/tasks.service';
import {
  CLIENT_SERVICE_TASK_ENTITY_TYPE,
  clientServiceExpenseCategory,
  clientServiceInvoiceType,
  clientServiceTaskTitle,
  requirePositiveAmount,
} from './client-service-flow-helpers';
import type {
  CreateClientServiceExpenseBody,
  CreateClientServiceExpensePlanBody,
  CreateClientServiceInvoiceBody,
  CreateClientServiceTaskBody,
} from './client-service-flows.types';

interface ClientServiceRecordRow {
  id: string;
  projectId: string;
  type: ClientServiceType;
  name: string;
  provider: string | null;
  billingModel: ClientServiceBillingModel;
  frequency: ExpenseFrequency;
  ourCost: unknown;
  clientCharge: unknown;
  taxStatus: TaxStatus;
  renewalDate: Date | null;
}

@Injectable()
export class ClientServiceFlowsService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly invoicesService: InvoicesService,
    private readonly expensePlansService: ExpensePlansService,
    private readonly expensesService: ExpensesService,
    private readonly tasksService: TasksService,
  ) {}

  async createInvoice(serviceId: string, body: CreateClientServiceInvoiceBody = {}) {
    const service = await this.loadService(serviceId);
    if (service.billingModel !== 'CLIENT_PAID') {
      throw new BadRequestException('Only client-paid services can create client invoices');
    }
    const amount = requirePositiveAmount(
      body.amount ?? Number(service.clientCharge),
      'Invoice amount',
    );
    return this.invoicesService.create({
      projectId: service.projectId,
      clientServiceRecordId: service.id,
      amount,
      type: body.type?.trim() || clientServiceInvoiceType(service.type),
      dueDate: body.dueDate?.trim() || undefined,
    });
  }

  async createExpensePlan(serviceId: string, body: CreateClientServiceExpensePlanBody = {}) {
    const service = await this.loadService(serviceId);
    const amount = requirePositiveAmount(body.amount ?? Number(service.ourCost), 'Plan amount');
    return this.expensePlansService.create({
      name: service.name,
      category: clientServiceExpenseCategory(service.type),
      amount,
      frequency: service.frequency,
      nextDueDate: body.nextDueDate?.trim() || service.renewalDate?.toISOString() || null,
      provider: service.provider,
      projectId: service.projectId,
      clientServiceRecordId: service.id,
      autoGenerate: body.autoGenerate ?? service.billingModel === 'COMPANY_PAID',
      notes: `From client service: ${service.name}`,
    });
  }

  async createExpense(serviceId: string, body: CreateClientServiceExpenseBody = {}) {
    const service = await this.loadService(serviceId);
    const amount = requirePositiveAmount(body.amount ?? Number(service.ourCost), 'Expense amount');
    const notes = body.notes?.trim() || `From client service: ${service.name}`;
    const status = body.status?.trim() || 'PLANNED';
    return this.expensesService.create({
      name: service.name,
      type: 'PLANNED',
      category: clientServiceExpenseCategory(service.type),
      amount,
      frequency: 'ONE_TIME',
      dueDate: body.dueDate?.trim() || service.renewalDate?.toISOString() || undefined,
      status,
      projectId: service.projectId,
      clientServiceRecordId: service.id,
      isPassThrough: service.billingModel === 'CLIENT_PAID',
      taxStatus: service.taxStatus,
      notes,
    });
  }

  async createTask(serviceId: string, body: CreateClientServiceTaskBody) {
    const service = await this.loadService(serviceId);
    const creatorId = body.creatorId?.trim();
    if (!creatorId) throw new BadRequestException('creatorId is required');
    return this.tasksService.create({
      title: body.title?.trim() || clientServiceTaskTitle(service.name, service.type),
      creatorId,
      description: body.description?.trim() || this.defaultTaskDescription(service),
      priority: body.priority?.trim() || 'NORMAL',
      dueDate: body.dueDate?.trim() || service.renewalDate?.toISOString() || undefined,
      links: [{ entityType: CLIENT_SERVICE_TASK_ENTITY_TYPE, entityId: service.id }],
    });
  }

  private async loadService(id: string): Promise<ClientServiceRecordRow> {
    const service = await this.prisma.clientServiceRecord.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Client service record not found');
    return service;
  }

  private defaultTaskDescription(service: ClientServiceRecordRow): string {
    const provider = service.provider ? `Provider: ${service.provider}` : 'Provider is not set';
    return `${provider}. Linked to client service record ${service.id}.`;
  }
}
