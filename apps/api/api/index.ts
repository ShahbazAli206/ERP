/**
 * Vercel Serverless Function entry point.
 *
 * Vercel invokes this handler for every incoming request. We import the
 * same Express `createApp()` used by the traditional `server.ts` entry
 * point, so all routes, middleware, and error handling work identically
 * in both environments.
 */
import 'dotenv/config';
import { createApp } from '../src/app';

const app = createApp();

export default app;
