import type { Pagination } from '../../shared/response';
import type { PaginationInput } from '../../shared/pagination';
import { settingsUsersRepository } from './users.repository';
import type { SettingsUserListItemDto } from './users.dto';

export const settingsUsersService = {
  async list(
    pagination: PaginationInput,
  ): Promise<{ items: SettingsUserListItemDto[]; pagination: Pagination }> {
    const { total, users } = await settingsUsersRepository.list(pagination);
    return {
      items: users,
      pagination: { page: pagination.page, pageSize: pagination.pageSize, total },
    };
  },
};
