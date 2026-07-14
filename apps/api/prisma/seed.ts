import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/database/prisma';
import {
  allPermissionKeys,
  MODULES,
  CRUD_ACTIONS,
  EXTRA_PERMISSIONS,
  permissionKey,
  ROLE_PERMISSIONS,
} from '../src/shared/constants/permissions';
import { getDemoUserIds } from './seed/helpers';
import { seedCatalog } from './seed/catalog';
import { seedSuppliersAndProcurement } from './seed/procurement';
import { seedShipmentsAndInventory, topUpInventoryTransactions } from './seed/shipmentsInventory';
import { seedDistributorsAndSales } from './seed/salesDistributors';
import { seedFinanceAndExpenses } from './seed/financeExpenses';
import { seedTaxAndSettings } from './seed/taxSettings';

/** Target from project_description.txt's "Demo Data" section — see seed/shipmentsInventory.ts's
 * topUpInventoryTransactions() for why this is only checked at the very end of the run. */
const TARGET_INVENTORY_TRANSACTIONS = 1000;

const DEMO_PASSWORD = 'Demo@1234';

const DEMO_USERS: Array<{ role: string; name: string; email: string }> = [
  { role: 'Super Admin', name: 'Ayesha Khan', email: 'admin@erp.local' },
  { role: 'Procurement Officer', name: 'Bilal Ahmed', email: 'procurement@erp.local' },
  { role: 'Inventory Manager', name: 'Sana Malik', email: 'inventory@erp.local' },
  { role: 'Sales Manager', name: 'Usman Tariq', email: 'sales@erp.local' },
  { role: 'Accountant', name: 'Fatima Iqbal', email: 'accounts@erp.local' },
  { role: 'Executive', name: 'Omar Sheikh', email: 'executive@erp.local' },
];

async function seedRolesAndUsers() {
  const permissionRows = new Map<string, string>();
  for (const module of MODULES) {
    for (const action of CRUD_ACTIONS) {
      const key = permissionKey(module, action);
      const permission = await prisma.permission.upsert({
        where: { key },
        update: {},
        create: { key, module, action },
      });
      permissionRows.set(key, permission.id);
    }
    for (const action of EXTRA_PERMISSIONS[module] ?? []) {
      const key = permissionKey(module, action);
      const permission = await prisma.permission.upsert({
        where: { key },
        update: {},
        create: { key, module, action },
      });
      permissionRows.set(key, permission.id);
    }
  }
  console.log(`  permissions: ${allPermissionKeys().length} defined`);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const [roleName, permissionKeys] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: permissionKeys.map((key) => ({
        roleId: role.id,
        permissionId: permissionRows.get(key)!,
      })),
    });

    const demoUser = DEMO_USERS.find((u) => u.role === roleName);
    if (demoUser) {
      await prisma.user.upsert({
        where: { email: demoUser.email },
        update: {},
        create: {
          name: demoUser.name,
          email: demoUser.email,
          passwordHash,
          roleId: role.id,
        },
      });
    }
  }
  console.log(`  roles: ${Object.keys(ROLE_PERMISSIONS).length} seeded with demo users`);
  console.log(`  demo login password for all seeded users: ${DEMO_PASSWORD}`);
}

async function main() {
  console.log('Seeding database...');

  await seedRolesAndUsers();

  const users = await getDemoUserIds();

  console.log('Seeding catalog (categories, warehouses, products)...');
  await seedCatalog();

  console.log('Seeding suppliers and purchase orders...');
  await seedSuppliersAndProcurement(users);

  console.log('Seeding shipments and inventory (goods receipts, adjustments)...');
  await seedShipmentsAndInventory(users);

  console.log('Seeding distributors and sales orders (invoices, payments, returns)...');
  await seedDistributorsAndSales(users);

  console.log('Seeding finance and expenses (chart of accounts, journal entries)...');
  await seedFinanceAndExpenses(users);

  console.log('Seeding tax rates and settings...');
  await seedTaxAndSettings();

  console.log('Topping up inventory transaction volume if needed...');
  await topUpInventoryTransactions(TARGET_INVENTORY_TRANSACTIONS);

  console.log('Seed complete.');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
