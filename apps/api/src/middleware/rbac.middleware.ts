import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../shared/ApiError';

export function requireRole(...roleNames: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    if (!roleNames.includes(req.user.roleName)) {
      throw ApiError.forbidden(`Requires one of roles: ${roleNames.join(', ')}`);
    }
    next();
  };
}

export function requirePermission(...permissionKeys: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    const hasAll = permissionKeys.every((key) => req.user!.permissions.includes(key));
    if (!hasAll) {
      throw ApiError.forbidden(`Requires permission(s): ${permissionKeys.join(', ')}`);
    }
    next();
  };
}
