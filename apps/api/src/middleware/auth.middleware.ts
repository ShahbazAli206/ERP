import type { NextFunction, Request, Response } from 'express';
import { authService } from '../modules/auth/auth.service';
import { ApiError } from '../shared/ApiError';

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing bearer token');
  }

  const token = header.slice('Bearer '.length);
  req.user = authService.verifyToken(token);
  next();
}
