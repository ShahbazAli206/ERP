export interface JournalLineDto {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface JournalEntryListItemDto {
  id: string;
  entryDate: Date;
  description: string | null;
  reference: string | null;
  totalDebit: number;
  totalCredit: number;
  createdAt: Date;
}

export interface JournalEntryDetailDto {
  id: string;
  entryDate: Date;
  description: string | null;
  reference: string | null;
  lines: JournalLineDto[];
  totalDebit: number;
  totalCredit: number;
  createdAt: Date;
}
