import { ApiError } from '../../shared/ApiError';
import type { Pagination } from '../../shared/response';
import { journalEntriesRepository, type JournalEntryDetail } from './journalEntries.repository';
import type { JournalEntryDetailDto, JournalEntryListItemDto, JournalLineDto } from './journalEntries.dto';
import type { CreateJournalEntryInput, ListJournalEntriesQuery } from './journalEntries.validation';

// Float-comparison epsilon: debit/credit sums should match exactly in well-formed data, but
// floating point arithmetic on money values can leave tiny rounding residue.
const BALANCE_EPSILON = 0.01;

function sumDebits(lines: Array<{ debit: number }>): number {
  return lines.reduce((sum, l) => sum + l.debit, 0);
}

function sumCredits(lines: Array<{ credit: number }>): number {
  return lines.reduce((sum, l) => sum + l.credit, 0);
}

function toListItemDto(entry: {
  id: string;
  entryDate: Date;
  description: string | null;
  reference: string | null;
  createdAt: Date;
  lines: Array<{ debit: number; credit: number }>;
}): JournalEntryListItemDto {
  return {
    id: entry.id,
    entryDate: entry.entryDate,
    description: entry.description,
    reference: entry.reference,
    totalDebit: sumDebits(entry.lines),
    totalCredit: sumCredits(entry.lines),
    createdAt: entry.createdAt,
  };
}

function toDetailDto(entry: JournalEntryDetail): JournalEntryDetailDto {
  const lines: JournalLineDto[] = entry.lines.map((line) => ({
    id: line.id,
    accountId: line.accountId,
    accountCode: line.account.code,
    accountName: line.account.name,
    debit: line.debit,
    credit: line.credit,
  }));

  return {
    id: entry.id,
    entryDate: entry.entryDate,
    description: entry.description,
    reference: entry.reference,
    lines,
    totalDebit: sumDebits(entry.lines),
    totalCredit: sumCredits(entry.lines),
    createdAt: entry.createdAt,
  };
}

export const journalEntriesService = {
  async list(
    query: ListJournalEntriesQuery,
  ): Promise<{ items: JournalEntryListItemDto[]; pagination: Pagination }> {
    const { total, entries } = await journalEntriesRepository.list(query);
    return {
      items: entries.map(toListItemDto),
      pagination: { page: query.page, pageSize: query.pageSize, total },
    };
  },

  async getDetail(id: string): Promise<JournalEntryDetailDto> {
    const entry = await journalEntriesRepository.findById(id);
    if (!entry) {
      throw ApiError.notFound('Journal entry not found');
    }
    return toDetailDto(entry);
  },

  async create(input: CreateJournalEntryInput): Promise<JournalEntryDetailDto> {
    const totalDebit = sumDebits(input.lines);
    const totalCredit = sumCredits(input.lines);
    if (Math.abs(totalDebit - totalCredit) > BALANCE_EPSILON) {
      throw ApiError.badRequest(
        `Journal entry is unbalanced: total debits (${totalDebit}) must equal total credits (${totalCredit})`,
      );
    }

    const entry = await journalEntriesRepository.create(input);
    return toDetailDto(entry);
  },
};
