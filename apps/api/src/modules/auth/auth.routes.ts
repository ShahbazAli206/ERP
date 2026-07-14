import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authController } from './auth.controller';

export const authRoutes = Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in with email and password
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful, returns a JWT and user profile }
 *       401: { description: Invalid credentials }
 */
authRoutes.post('/login', authController.login);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out (client discards the JWT; stateless demo auth)
 *     responses:
 *       200: { description: Logged out }
 */
authRoutes.post('/logout', authenticate, authController.logout);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the current authenticated user's profile
 *     responses:
 *       200: { description: Current user profile }
 *       401: { description: Missing or invalid token }
 */
authRoutes.get('/me', authenticate, authController.me);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset (mock — no email is actually sent in the demo)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: Generic success response regardless of whether the email exists }
 */
authRoutes.post('/forgot-password', authController.forgotPassword);
