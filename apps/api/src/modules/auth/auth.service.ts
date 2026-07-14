import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { ApiError } from '../../shared/ApiError';
import { logger } from '../../utils/logger';
import { authRepository, type AuthUserWithRole } from './auth.repository';
import type { LoginResponseDto, UserProfileDto } from './auth.dto';
import type { JwtPayload } from './auth.types';

function toProfileDto(user: AuthUserWithRole): UserProfileDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.name,
    permissions: user.role.permissions.map((rp) => rp.permission.key),
    isActive: user.isActive,
    avatarUrl: user.avatarUrl,
    lastLoginAt: user.lastLoginAt,
  };
}

function signToken(user: AuthUserWithRole): string {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    roleId: user.roleId,
    roleName: user.role.name,
    permissions: user.role.permissions.map((rp) => rp.permission.key),
  };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponseDto> {
    const user = await authRepository.findUserByEmail(email);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    await authRepository.updateLastLogin(user.id);

    return {
      token: signToken(user),
      expiresIn: env.JWT_EXPIRES_IN,
      user: toProfileDto(user),
    };
  },

  async me(userId: string): Promise<UserProfileDto> {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return toProfileDto(user);
  },

  async forgotPassword(email: string): Promise<void> {
    const user = await authRepository.findUserByEmail(email);
    if (user) {
      // Demo: no real email service wired up yet (see Phase 4 EmailService interface).
      logger.info({ email }, 'Password reset requested (mock — no email sent in demo)');
    }
    // Always respond as if it succeeded, regardless of whether the email exists.
  },

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch {
      throw ApiError.unauthorized('Invalid or expired token');
    }
  },
};
