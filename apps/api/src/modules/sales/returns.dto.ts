export interface SalesReturnDto {
  id: string;
  salesOrderId: string;
  orderNumber: string;
  productId: string;
  productName: string;
  quantity: number;
  reason: string | null;
  hasCreditNote: boolean;
  createdAt: Date;
}

export interface CreditNoteDto {
  id: string;
  creditNoteNumber: string;
  invoiceId: string | null;
  salesReturnId: string | null;
  amount: number;
  reason: string | null;
  createdAt: Date;
}
