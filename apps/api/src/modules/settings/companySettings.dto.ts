export interface CompanySettingDto {
  id: string;
  companyName: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  baseCurrency: string;
  logoUrl: string | null;
  updatedAt: Date;
}
