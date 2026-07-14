import { ApiError } from '../../shared/ApiError';
import { systemSettingsRepository } from './systemSettings.repository';
import type { SystemSettingDto } from './systemSettings.dto';

export const systemSettingsService = {
  async get(key: string): Promise<SystemSettingDto> {
    const setting = await systemSettingsRepository.findByKey(key);
    if (!setting) {
      throw ApiError.notFound(`System setting '${key}' not found`);
    }
    return setting;
  },

  async set(key: string, value: string): Promise<SystemSettingDto> {
    return systemSettingsRepository.upsert(key, value);
  },
};
