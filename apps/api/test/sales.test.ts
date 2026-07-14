import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/database/prisma';
import { seedFullAccessUser, cleanupUser } from './helpers';

describe('Sales (happy path — order to stock consumption)', () => {
  const app = createApp();
  let fixture: Awaited<ReturnType<typeof seedFullAccessUser>>;
  let token: string;
  let warehouseId: string;
  let productId: string;
  let distributorId: string;
  let orderId: string;

  const auth = () => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    fixture = await seedFullAccessUser('sales');
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: fixture.user.email, password: fixture.password });
    token = login.body.data.token;

    const warehouse = await request(app)
      .post('/api/inventory/warehouses')
      .set(auth())
      .send({ name: 'Sales Test Warehouse' });
    warehouseId = warehouse.body.data.id;

    const product = await request(app)
      .post('/api/inventory/products')
      .set(auth())
      .send({ sku: 'SALES-TEST-SKU', name: 'Sales Test Product', costPrice: 5, sellingPrice: 15 });
    productId = product.body.data.id;

    await request(app)
      .post('/api/inventory/goods-receipts')
      .set(auth())
      .send({ warehouseId, items: [{ productId, quantity: 100, lotNumber: 'SALES-LOT-1', costPrice: 5 }] });

    const distributor = await request(app)
      .post('/api/distributors')
      .set(auth())
      .send({ name: 'Test Distributor', region: 'Test Region' });
    distributorId = distributor.body.data.id;
  });

  afterAll(async () => {
    if (orderId) {
      await prisma.salesOrderItem.deleteMany({ where: { salesOrderId: orderId } });
      await prisma.statusHistory.deleteMany({ where: { salesOrderId: orderId } });
      await prisma.salesOrder.delete({ where: { id: orderId } }).catch(() => undefined);
    }
    if (distributorId) await prisma.distributor.delete({ where: { id: distributorId } }).catch(() => undefined);
    if (productId) {
      await prisma.inventoryLot.deleteMany({ where: { productId } });
      await prisma.inventoryTransaction.deleteMany({ where: { productId } });
      await prisma.product.delete({ where: { id: productId } }).catch(() => undefined);
    }
    if (warehouseId) await prisma.warehouse.delete({ where: { id: warehouseId } }).catch(() => undefined);
    await cleanupUser(fixture.user.id, fixture.role.id);
    await prisma.$disconnect();
  });

  it('creates a sales order in DRAFT status', async () => {
    const res = await request(app)
      .post('/api/sales/orders')
      .set(auth())
      .send({
        distributorId,
        items: [{ productId, quantity: 10, unitPrice: 15 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('DRAFT');
    orderId = res.body.data.id;
  });

  it('confirms the order and consumes stock FIFO from the chosen warehouse', async () => {
    const res = await request(app)
      .post(`/api/sales/orders/${orderId}/confirm`)
      .set(auth())
      .send({ warehouseId });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CONFIRMED');

    const productDetail = await request(app).get(`/api/inventory/products/${productId}`).set(auth());
    expect(productDetail.body.data.stockOnHand).toBe(90);
  });

  it('rejects re-confirming an already-confirmed order', async () => {
    const res = await request(app)
      .post(`/api/sales/orders/${orderId}/confirm`)
      .set(auth())
      .send({ warehouseId });
    expect(res.status).toBe(400);
  });

  it('cancels the order and restores the consumed stock', async () => {
    const res = await request(app).post(`/api/sales/orders/${orderId}/cancel`).set(auth()).send({});
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CANCELLED');

    const productDetail = await request(app).get(`/api/inventory/products/${productId}`).set(auth());
    expect(productDetail.body.data.stockOnHand).toBe(100);
  });
});
