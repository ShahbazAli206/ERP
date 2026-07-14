import { ApiError } from '../../shared/ApiError';
import type { Pagination } from '../../shared/response';
import { accountsRepository } from './accounts.repository';
import type { AccountDto } from './accounts.dto';
import type {
  CreateAccountInput,
  ListAccountsQuery,
  UpdateAccountInput,
} from './accounts.validation';

function toDto(account: { id: string; code: string; name: string; type: AccountDto['type'] }): AccountDto {
  return { id: account.id, code: account.code, name: account.name, type: account.type };
}

export const accountsService = {
  async list(query: ListAccountsQuery): Promise<{ items: AccountDto[]; pagination: Pagination }> {
    const { total, accounts } = await accountsRepository.list(query);
    return {
      items: accounts.map(toDto),
      pagination: { page: query.page, pageSize: query.pageSize, total },
    };
  },

  async getById(id: string): Promise<AccountDto> {
    const account = await accountsRepository.findById(id);
    if (!account) {
      throw ApiError.notFound('Account not found');
    }
    return toDto(account);
  },

  async create(input: CreateAccountInput): Promise<AccountDto> {
    // Unique constraint on `code` is enforced at the schema level; the global error handler
    // converts the resulting P2002 into a clean 409, so no pre-check needed here.
    const account = await accountsRepository.create(input);
    return toDto(account);
  },

  async update(id: string, input: UpdateAccountInput): Promise<AccountDto> {
    const existing = await accountsRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Account not found');
    }
    const updated = await accountsRepository.update(id, input);
    return toDto(updated);
  },

  async remove(id: string): Promise<void> {
    const existing = await accountsRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Account not found');
    }
    await accountsRepository.remove(id);
  },
};
