import { BadRequestException } from '@nestjs/common';
import {
  getInvoiceTaxMoneyStatusGateErrors,
  getOfficialInvoiceRequestSendErrors,
  INVOICE_TAX_READINESS_GATE_CODE,
  type InvoiceTaxCompanyRequisites,
} from '@nbos/shared';

export function assertInvoiceTaxMoneyStatusGate(input: {
  taxStatus: string | null | undefined;
  currentMoneyStatus: string;
  targetMoneyStatus: string;
  companyId?: string | null;
  company?: InvoiceTaxCompanyRequisites | null;
  officialInvoiceRequestSent: boolean;
}): void {
  const errors = getInvoiceTaxMoneyStatusGateErrors(input);
  if (errors.length === 0) return;
  throw new BadRequestException({
    statusCode: 400,
    code: INVOICE_TAX_READINESS_GATE_CODE,
    message: `Cannot move to ${input.targetMoneyStatus}: Tax invoice is not ready`,
    errors,
  });
}

export function assertOfficialInvoiceRequestSend(input: {
  taxStatus: string | null | undefined;
  companyId?: string | null;
  company?: InvoiceTaxCompanyRequisites | null;
}): void {
  const errors = getOfficialInvoiceRequestSendErrors(input);
  if (errors.length === 0) return;
  throw new BadRequestException({
    statusCode: 400,
    code: INVOICE_TAX_READINESS_GATE_CODE,
    message: 'Cannot send official invoice request: company requisites are incomplete',
    errors,
  });
}
