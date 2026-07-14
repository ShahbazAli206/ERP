import { companySettingsRepository } from './companySettings.repository';
import type { CompanySettingDto } from './companySettings.dto';
import type { UpdateCompanySettingsInput } from './companySettings.validation';

const DEFAULT_COMPANY_SETTINGS = {
  companyName: 'My Company',
  baseCurrency: 'PKR',
};

export const companySettingsService = {
  async get(): Promise<CompanySettingDto> {
    const existing = await companySettingsRepository.findFirst();
    if (existing) {
      return existing;
    }
    return companySettingsRepository.create(DEFAULT_COMPANY_SETTINGS);
  },

  async update(input: UpdateCompanySettingsInput): Promise<CompanySettingDto> {
    const existing = await companySettingsRepository.findFirst();
    if (!existing) {
      return companySettingsRepository.create({ ...DEFAULT_COMPANY_SETTINGS, ...input });
    }
    return companySettingsRepository.update(existing.id, input);
  },
};
