import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/database/prisma';
import { seedFullAccessUser, cleanupUser } from './helpers';

describe('Inventory (happy path)', () => {
  const app = createApp();
  let fixture: Awaited<ReturnType<typeof seedFullAccessUser>>;
  let token: string;
  let categoryId: string;
  let warehouseId: string;
  let productId: string;

  beforeAll(async () => {
    fixture = await seedFullAccessUser('inventory');
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: fixture.user.email, password: fixture.password });
    token = login.body.data.token;
  });

  afterAll(async () => {
    // Order matters for FK integrity: lots/transactions -> product -> category/warehouse -> user/role.
    if (productId) await prisma.inventoryLot.deleteMany({ where: { productId } });
    if (productId) await prisma.inventoryTransaction.deleteMany({ where: { productId } });
    if (productId) await prisma.product.delete({ where: { id: productId } }).catch(() => undefined);
    if (warehouseId) await prisma.warehouse.delete({ where: { id: warehouseId } }).catch(() => undefined);
    if (categoryId) await prisma.category.delete({ where: { id: categoryId } }).catch(() => undefined);
    await cleanupUser(fixture.user.id, fixture.role.id);
    await prisma.$disconnect();
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  it('creates a category, a warehouse, and a product', async () => {
    const category = await request(app).post('/api/inventory/categories').set(auth()).send({ name: 'Test Category' });
    expect(category.status).toBe(201);
    categoryId = category.body.data.id;

    const warehouse = await request(app)
      .post('/api/inventory/warehouses')
      .set(auth())
      .send({ name: 'Test Warehouse' });
    expect(warehouse.status).toBe(201);
    warehouseId = warehouse.body.data.id;

    const product = await request(app)
      .post('/api/inventory/products')
      .set(auth())
      .send({
        sku: 'TEST-SKU-001',
        name: 'Test Product',
        categoryId,
        unit: 'pcs',
        costPrice: 10,
        sellingPrice: 20,
        reorderLevel: 5,
      });
    expect(product.status).toBe(201);
    expect(product.body.data.sku).toBe('TEST-SKU-001');
    productId = product.body.data.id;
  });

  it('rejects a duplicate SKU with a 409', async () => {
    const res = await request(app)
      .post('/api/inventory/products')
      .set(auth())
      .send({ sku: 'TEST-SKU-001', name: 'Duplicate', costPrice: 1, sellingPrice: 2 });
    expect(res.status).toBe(409);
  });

  it('receives goods into a lot and reflects it in stock-on-hand', async () => {
    const receipt = await request(app)
      .post('/api/inventory/goods-receipts')
      .set(auth())
      .send({
        warehouseId,
        items: [{ productId, quantity: 50, lotNumber: 'LOT-001', costPrice: 10 }],
      });
    expect(receipt.status).toBe(201);

    const detail = await request(app).get(`/api/inventory/products/${productId}`).set(auth());
    expect(detail.status).toBe(200);
    expect(detail.body.data.stockOnHand).toBe(50);
    expect(detail.body.data.isLowStock).toBe(false);
  });

  it('flags low stock once a FIFO decrease adjustment drops below the reorder level', async () => {
    const adjustment = await request(app)
      .post('/api/inventory/adjustments')
      .set(auth())
      .send({ productId, warehouseId, quantityDelta: -47, reason: 'Test consumption' });
    expect(adjustment.status).toBe(201);

    const detail = await request(app).get(`/api/inventory/products/${productId}`).set(auth());
    expect(detail.body.data.stockOnHand).toBe(3);
    expect(detail.body.data.isLowStock).toBe(true);
  });

  it('reports the product in the low-stock alert list', async () => {
    const res = await request(app).get('/api/inventory/alerts/low-stock').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.some((row: { productId: string }) => row.productId === productId)).toBe(true);
  });
});
