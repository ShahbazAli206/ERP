export interface ExpenseAttachmentDto {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface ExpenseListItemDto {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  description: string | null;
  expenseDate: Date;
  createdByName: string;
  createdAt: Date;
  attachmentCount: number;
}

export interface ExpenseDetailDto {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  description: string | null;
  expenseDate: Date;
  createdById: string;
  createdByName: string;
  createdAt: Date;
  attachments: ExpenseAttachmentDto[];
}

export interface ExpenseReportItemDto {
  categoryId: string;
  categoryName: string;
  total: number;
}

export interface ExpenseReportDto {
  from: Date;
  to: Date;
  items: ExpenseReportItemDto[];
  grandTotal: number;
}
