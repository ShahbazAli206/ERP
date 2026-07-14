import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/database/prisma';
import { seedFullAccessUser, cleanupUser } from './helpers';

describe('Auth (happy path)', () => {
  const app = createApp();
  let fixture: Awaited<ReturnType<typeof seedFullAccessUser>>;

  beforeAll(async () => {
    fixture = await seedFullAccessUser('auth');
  });

  afterAll(async () => {
    await cleanupUser(fixture.user.id, fixture.role.id);
    await prisma.$disconnect();
  });

  it('logs in with correct credentials and returns a token + permissions', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: fixture.user.email, password: fixture.password });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user.email).toBe(fixture.user.email);
    expect(res.body.data.user.permissions.length).toBeGreaterThan(0);
  });

  it('rejects an incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: fixture.user.email, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBeDefined();
  });

  it('rejects a malformed login body with a 400 and validation details', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
  });

  it('returns the caller profile for a valid token on /me', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: fixture.user.email, password: fixture.password });
    const token = login.body.data.token;

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(fixture.user.email);
  });

  it('rejects /me with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the same generic message for /forgot-password regardless of whether the email exists', async () => {
    const real = await request(app).post('/api/auth/forgot-password').send({ email: fixture.user.email });
    const fake = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'definitely-not-a-real-user@erp-test.local' });

    expect(real.status).toBe(200);
    expect(fake.status).toBe(200);
    expect(real.body.data.message).toBe(fake.body.data.message);
  });
});
