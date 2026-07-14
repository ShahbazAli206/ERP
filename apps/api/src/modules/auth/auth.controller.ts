import type { Request, Response } from 'express';
import { ApiError } from '../../shared/ApiError';
import { ok } from '../../shared/response';
import { authService } from './auth.service';
import { forgotPasswordSchema, loginSchema } from './auth.validation';

export const authController = {
  async login(req: Request, res: Response) {
    const { email, password } = loginSchema.parse(req.body);
    const result = await authService.login(email, password);
    ok(res, result);
  },

  async logout(_req: Request, res: Response) {
    // Stateless JWT demo: nothing to invalidate server-side, client just discards the token.
    ok(res, { message: 'Logged out' });
  },

  async me(req: Request, res: Response) {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    const profile = await authService.me(req.user.sub);
    ok(res, profile);
  },

  async forgotPassword(req: Request, res: Response) {
    const { email } = forgotPasswordSchema.parse(req.body);
    await authService.forgotPassword(email);
    ok(res, { message: 'If that email exists, a reset link has been sent.' });
  },
};
