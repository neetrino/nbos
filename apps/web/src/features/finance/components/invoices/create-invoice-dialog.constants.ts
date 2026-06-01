/** Default due date offset shown in create popup and applied server-side when omitted. */
export const CREATE_INVOICE_DEFAULT_DUE_DAYS = 10;

export function defaultCreateInvoiceDueDateIso(): string {
  const due = new Date();
  due.setDate(due.getDate() + CREATE_INVOICE_DEFAULT_DUE_DAYS);
  due.setHours(0, 0, 0, 0);
  return due.toISOString().slice(0, 10);
}
