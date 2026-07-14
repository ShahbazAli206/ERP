export interface SettingsUserListItemDto {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  role: {
    name: string;
  };
}
