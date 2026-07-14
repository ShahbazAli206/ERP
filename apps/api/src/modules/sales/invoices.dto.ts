export interface InvoiceListItemDto {
  id: string;
  invoiceNumber: string;
  salesOrderId: string;
  orderNumber: string;
  distributorName: string;
  issueDate: Date;
  dueDate: Date;
  totalAmount: number;
  paidAmount: number;
  status: string;
}

export interface InvoicePaymentDto {
  id: string;
  amount: number;
  method: string;
  paymentDate: Date;
  reference: string | null;
}

export interface InvoiceDetailDto extends InvoiceListItemDto {
  currency: string;
  payments: InvoicePaymentDto[];
  creditNotesTotal: number;
  balanceDue: number;
}
