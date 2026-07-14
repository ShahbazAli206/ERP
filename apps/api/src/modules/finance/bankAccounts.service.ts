import { ApiError } from '../../shared/ApiError';
import type { Pagination } from '../../shared/response';
import { bankAccountsRepository } from './bankAccounts.repository';
import type { BankAccountDto } from './bankAccounts.dto';
import type {
  CreateBankAccountInput,
  ListBankAccountsQuery,
  UpdateBankAccountInput,
} from './bankAccounts.validation';

function toDto(bankAccount: {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  currency: string;
  balance: number;
}): BankAccountDto {
  return {
    id: bankAccount.id,
    name: bankAccount.name,
    bankName: bankAccount.bankName,
    accountNumber: bankAccount.accountNumber,
    currency: bankAccount.currency,
    balance: bankAccount.balance,
  };
}

export const bankAccountsService = {
  async list(
    query: ListBankAccountsQuery,
  ): Promise<{ items: BankAccountDto[]; pagination: Pagination }> {
    const { total, bankAccounts } = await bankAccountsRepository.list(query);
    return {
      items: bankAccounts.map(toDto),
      pagination: { page: query.page, pageSize: query.pageSize, total },
    };
  },

  async getById(id: string): Promise<BankAccountDto> {
    const bankAccount = await bankAccountsRepository.findById(id);
    if (!bankAccount) {
      throw ApiError.notFound('Bank account not found');
    }
    return toDto(bankAccount);
  },

  async create(input: CreateBankAccountInput): Promise<BankAccountDto> {
    const bankAccount = await bankAccountsRepository.create(input);
    return toDto(bankAccount);
  },

  async update(id: string, input: UpdateBankAccountInput): Promise<BankAccountDto> {
    const existing = await bankAccountsRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Bank account not found');
    }
    const updated = await bankAccountsRepository.update(id, input);
    return toDto(updated);
  },

  async remove(id: string): Promise<void> {
    const existing = await bankAccountsRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Bank account not found');
    }
    await bankAccountsRepository.remove(id);
  },
};
