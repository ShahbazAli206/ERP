import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../database/prisma';
import { toSkipTake } from '../../shared/pagination';
import type { CreateJournalEntryInput, ListJournalEntriesQuery } from './journalEntries.validation';

const detailInclude = {
  lines: { include: { account: { select: { id: true, code: true, name: true } } } },
} satisfies Prisma.JournalEntryInclude;

export const journalEntriesRepository = {
  async list(query: ListJournalEntriesQuery) {
    const [total, entries] = await Promise.all([
      prisma.journalEntry.count(),
      prisma.journalEntry.findMany({
        orderBy: { [query.sortBy]: query.sortOrder },
        ...toSkipTake(query),
        include: { lines: true },
      }),
    ]);

    return { total, entries };
  },

  findById(id: string) {
    return prisma.journalEntry.findUnique({ where: { id }, include: detailInclude });
  },

  create(input: CreateJournalEntryInput) {
    return prisma.journalEntry.create({
      data: {
        entryDate: input.entryDate,
        description: input.description,
        reference: input.reference,
        lines: {
          create: input.lines.map((line) => ({
            accountId: line.accountId,
            debit: line.debit,
            credit: line.credit,
          })),
        },
      },
      include: detailInclude,
    });
  },
};

export type JournalEntryDetail = NonNullable<
  Awaited<ReturnType<typeof journalEntriesRepository.findById>>
>;
