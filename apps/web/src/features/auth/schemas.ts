import { z } from 'zod';

/**
 * Reference Zod schemas for the auth forms. This is the pattern every future
 * module form should follow: define the schema here (or in a module's own
 * `schemas.ts`), derive the form's type with `z.infer`, and pass the schema
 * to `zodResolver` in the component (see `login-form.tsx`).
 */
export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
