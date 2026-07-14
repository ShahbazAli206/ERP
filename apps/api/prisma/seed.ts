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

async function seedCatalog() {
  // Phase 5: 50 products across categories, with SKU/barcode/reorder levels.
}

async function seedSuppliersAndProcurement() {
  // Phase 5: 20 suppliers, 100 purchase orders (+ items, status history, attachments).
}

async function seedShipmentsAndInventory() {
  // Phase 5: shipments linked to POs, warehouse(s), inventory lots, 1000 stock transactions.
}

async function seedDistributorsAndSales() {
  // Phase 5: 15 distributors, 300 sales orders (+ items, invoices, returns, credit notes).
}

async function seedFinanceAndExpenses() {
  // Phase 5: chart of accounts, 12 months of journal entries/expenses/payments reconciled
  // with sales & purchases so dashboard KPIs are internally consistent.
}

async function seedTaxAndSettings() {
  // Phase 5: tax rates, company settings, exchange rates.
}

async function main() {
  console.log('Seeding database...');

  await seedRolesAndUsers();
  await seedCatalog();
  await seedSuppliersAndProcurement();
  await seedShipmentsAndInventory();
  await seedDistributorsAndSales();
  await seedFinanceAndExpenses();
  await seedTaxAndSettings();

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
