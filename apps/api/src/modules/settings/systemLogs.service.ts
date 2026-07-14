import type { Pagination } from '../../shared/response';
import type { PaginationInput } from '../../shared/pagination';
import { systemLogsRepository } from './systemLogs.repository';
import type { SystemLogDto } from './systemLogs.dto';

export const systemLogsService = {
  async list(
    pagination: PaginationInput,
  ): Promise<{ items: SystemLogDto[]; pagination: Pagination }> {
    const { total, logs } = await systemLogsRepository.list(pagination);
    return {
      items: logs.map((log) => ({
        id: log.id,
        userId: log.userId,
        userName: log.user?.name ?? null,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        metadata: log.metadata,
        createdAt: log.createdAt,
      })),
      pagination: { page: pagination.page, pageSize: pagination.pageSize, total },
    };
  },
};
