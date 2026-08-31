import { BadRequestException } from '@nestjs/common';
import {
  getInvoiceOrderCommentGateErrors,
  getInvoiceTaxMoneyStatusGateErrors,
  getOfficialInvoiceOrderCommentSendErrors,
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
  orderId?: string | null;
  orderComment?: string | null;
}): void {
  const errors = [
    ...getInvoiceTaxMoneyStatusGateErrors(input),
    ...getInvoiceOrderCommentGateErrors(input),
  ];
  if (errors.length === 0) return;
  throw new BadRequestException({
    statusCode: 400,
    code: INVOICE_TAX_READINESS_GATE_CODE,
    message: `Cannot move to ${input.targetMoneyStatus}: invoice is not ready`,
    errors,
  });
}

export function assertOfficialInvoiceRequestSend(input: {
  taxStatus: string | null | undefined;
  companyId?: string | null;
  company?: InvoiceTaxCompanyRequisites | null;
  orderId?: string | null;
  orderComment?: string | null;
}): void {
  const errors = [
    ...getOfficialInvoiceRequestSendErrors(input),
    ...getOfficialInvoiceOrderCommentSendErrors(input),
  ];
  if (errors.length === 0) return;
  throw new BadRequestException({
    statusCode: 400,
    code: INVOICE_TAX_READINESS_GATE_CODE,
    message: 'Cannot send official invoice request: invoice is not ready',
    errors,
  });
}
