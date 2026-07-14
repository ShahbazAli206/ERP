import bcrypt from 'bcryptjs';
import { prisma } from '../src/database/prisma';
import { allPermissionKeys } from '../src/shared/constants/permissions';

/**
 * Minimal RBAC fixture for integration tests — a role with every permission (mirrors "Super
 * Admin" in the real seed, see `prisma/seed.ts`'s `seedRolesAndUsers`) plus one user on that
 * role. Kept separate from the real seed script since these tests run against a dedicated
 * `test.db` (see `test/jest.setup.ts`) with no demo data — each test file seeds only the
 * handful of records its own happy path needs, then deletes them in `afterAll`.
 */
export async function seedFullAccessUser(emailSuffix: string) {
  const permissionKeys = allPermissionKeys();

  const permissions = await Promise.all(
    permissionKeys.map((key) => {
      const [module, action] = key.split(':');
      return prisma.permission.upsert({
        where: { key },
        update: {},
        create: { key, module, action },
      });
    }),
  );

  const role = await prisma.role.create({
    data: {
      name: `Test Full Access ${emailSuffix}`,
      permissions: {
        create: permissions.map((p) => ({ permissionId: p.id })),
      },
    },
  });

  const passwordHash = await bcrypt.hash('Test@1234', 4); // low bcrypt cost — tests only, not real security
  const user = await prisma.user.create({
    data: {
      name: `Test User ${emailSuffix}`,
      email: `test-${emailSuffix}@erp-test.local`,
      passwordHash,
      roleId: role.id,
    },
  });

  return { role, user, password: 'Test@1234' };
}

/** Deletes a user+role fixture created by `seedFullAccessUser`. Permissions are left in place (upserted, shared/idempotent). */
export async function cleanupUser(userId: string, roleId: string) {
  await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
  await prisma.role.delete({ where: { id: roleId } }).catch(() => undefined);
}
