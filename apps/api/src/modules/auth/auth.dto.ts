export interface UserProfileDto {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  avatarUrl: string | null;
  lastLoginAt: Date | null;
}

export interface LoginResponseDto {
  token: string;
  expiresIn: string;
  user: UserProfileDto;
}
