import { prisma } from '../../src/database/prisma';
import { shipmentsService } from '../../src/modules/shipments/shipments.service';
import { stockService } from '../../src/modules/inventory/stock.service';
import { ApiError } from '../../src/shared/ApiError';
import { addDays, addDaysClamped, CURRENCY_RATES, DemoUsers, randomChoice, randomFloat, randomInt, round2, shuffle } from './helpers';

const PORT_BY_COUNTRY: Record<string, string> = {
  China: 'Shenzhen Port',
  'United Arab Emirates': 'Jebel Ali Port',
  Germany: 'Hamburg Port',
  'United States': 'Port of Los Angeles',
  Turkey: 'Port of Mersin',
  Vietnam: 'Port of Haiphong',
  Italy: 'Port of Genoa',
  'United Kingdom': 'Port of Southampton',
  'South Korea': 'Port of Busan',
  Malaysia: 'Port Klang',
  Thailand: 'Laem Chabang Port',
  Japan: 'Port of Yokohama',
  'Saudi Arabia': 'Jeddah Islamic Port',
  Indonesia: 'Tanjung Priok Port',
  Bangladesh: 'Chattogram Port',
  Netherlands: 'Port of Rotterdam',
  Spain: 'Port of Valencia',
  Singapore: 'Port of Singapore',
  Taiwan: 'Port of Kaohsiung',
  France: 'Port of Marseille',
};

const DESTINATION_PORTS = ['Port Qasim, Karachi', 'Karachi Port'];
const CONTAINER_PREFIXES = ['MSCU', 'MAEU', 'CMAU', 'OOLU', 'HLXU', 'COSU'];

function generateContainerNumber(): string {
  return `${randomChoice(CONTAINER_PREFIXES)}${randomInt(1000000, 9999999)}`;
}

const SHIPMENT_STEPS = ['BOOKED', 'IN_TRANSIT', 'ARRIVED_AT_PORT', 'CUSTOMS_CLEARANCE', 'DELIVERED'] as const;
type ShipmentStep = (typeof SHIPMENT_STEPS)[number];

/** Walks a freshly-created (BOOKED) shipment forward, one allowed transition at a time, to `target`. */
async function advanceShipmentTo(shipmentId: string, userId: string, target: ShipmentStep, actualArrival?: Date) {
  const targetIndex = SHIPMENT_STEPS.indexOf(target);
  for (let i = 1; i <= targetIndex; i++) {
    const step = SHIPMENT_STEPS[i];
    const isLast = i === targetIndex;
    await shipmentsService.updateStatus(shipmentId, userId, step, undefined, isLast ? actualArrival : undefined);
  }
}

async function delayShipment(shipmentId: string, userId: string) {
  await shipmentsService.updateStatus(shipmentId, userId, 'DELAYED', 'Held up in customs backlog');
}

interface PoWithItems {
  id: string;
  poNumber: string;
  currency: string;
  exchangeRateToBase: number;
  orderDate: Date;
  supplierId: string;
  supplier: { country: string };
  items: Array<{ id: string; productId: string; quantity: number; unitPrice: number; receivedQuantity: number }>;
}

export async function seedShipmentsAndInventory(users: DemoUsers) {
  const existingLots = await prisma.inventoryLot.count();
  if (existingLots > 0) {
    console.log('  Shipments/inventory already seeded, skipping');
    return;
  }

  const warehouses = await prisma.warehouse.findMany({ orderBy: { name: 'asc' } });
  const mainWarehouse = warehouses.find((w) => w.name === 'Karachi Main Warehouse') ?? warehouses[0];
  const secondaryWarehouses = warehouses.filter((w) => w.id !== mainWarehouse.id);

  const orderedPOs = (await prisma.purchaseOrder.findMany({
    where: { status: 'ORDERED' },
    include: { items: true, supplier: { select: { country: true } } },
  })) as PoWithItems[];

  const shuffled = shuffle(orderedPOs);
  const fullyReceiveCount = Math.round(shuffled.length * 0.6);
  const partialCount = Math.round(shuffled.length * 0.26);
  const fullyReceive = shuffled.slice(0, fullyReceiveCount);
  const partial = shuffled.slice(fullyReceiveCount, fullyReceiveCount + partialCount);
  const stayOrdered = shuffled.slice(fullyReceiveCount + partialCount);

  let processed = 0;
  const total = shuffled.length;

  async function createShipmentFor(po: PoWithItems) {
    const subtotal = po.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    return shipmentsService.create({
      purchaseOrderId: po.id,
      containerNumber: generateContainerNumber(),
      originPort: PORT_BY_COUNTRY[po.supplier.country] ?? 'Origin Port',
      destinationPort: randomChoice(DESTINATION_PORTS),
      estimatedArrival: addDays(po.orderDate, randomInt(20, 45)),
      freightCost: round2(subtotal * randomFloat(0.03, 0.07)),
      insuranceCost: round2(subtotal * randomFloat(0.005, 0.02)),
      dutyCost: round2(subtotal * randomFloat(0.05, 0.15)),
      customsCharges: round2(subtotal * randomFloat(0.01, 0.03)),
      currency: po.currency,
      exchangeRateToBase: po.exchangeRateToBase,
      items: po.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    });
  }

  // All PO-linked goods receipts land in the main warehouse — sales orders confirm() against a
  // single warehouse with no cross-warehouse fallback, so concentrating sellable stock there
  // avoids manufacturing artificial stock-outs purely from a warehouse-routing choice.
  // Secondary warehouses still get stock via the manual adjustment pass below, for variety.
  function pickReceiptWarehouse() {
    return mainWarehouse.id;
  }

  // Fully received: goods receipt for the entire ordered quantity -> PO flips to RECEIVED.
  for (const po of fullyReceive) {
    const shipment = await createShipmentFor(po);
    const actualArrival = addDaysClamped(po.orderDate, randomInt(15, 40));
    await advanceShipmentTo(shipment.id, users.procurement, 'DELIVERED', actualArrival);

    const warehouseId = pickReceiptWarehouse();
    await stockService.goodsReceipt({
      purchaseOrderId: po.id,
      warehouseId,
      items: po.items.map((item) => ({
        productId: item.productId,
        purchaseOrderItemId: item.id,
        quantity: item.quantity,
        lotNumber: po.poNumber,
        costPrice: round2(item.unitPrice * po.exchangeRateToBase),
      })),
    });

    processed += 1;
    if (processed % 25 === 0) console.log(`  shipments/receipts: ${processed}/${total} processed`);
  }

  // Partially received: only a fraction of each line's quantity has been checked into stock ->
  // PO stays PARTIALLY_RECEIVED. Shipment is mostly "arrived" but not every line fully cleared.
  for (const po of partial) {
    const shipment = await createShipmentFor(po);
    const target: ShipmentStep = Math.random() < 0.8 ? 'DELIVERED' : 'CUSTOMS_CLEARANCE';
    const actualArrival = target === 'DELIVERED' ? addDaysClamped(po.orderDate, randomInt(15, 40)) : undefined;
    await advanceShipmentTo(shipment.id, users.procurement, target, actualArrival);

    const warehouseId = pickReceiptWarehouse();
    await stockService.goodsReceipt({
      purchaseOrderId: po.id,
      warehouseId,
      items: po.items.map((item) => ({
        productId: item.productId,
        purchaseOrderItemId: item.id,
        quantity: Math.max(1, Math.round(item.quantity * randomFloat(0.5, 0.9))),
        lotNumber: po.poNumber,
        costPrice: round2(item.unitPrice * po.exchangeRateToBase),
      })),
    });

    processed += 1;
    if (processed % 25 === 0) console.log(`  shipments/receipts: ${processed}/${total} processed`);
  }

  // Still on order: no goods receipt yet. Shipment reflects goods still moving (or delayed).
  for (const po of stayOrdered) {
    const shipment = await createShipmentFor(po);
    const roll = Math.random();
    if (roll < 0.15) {
      await delayShipment(shipment.id, users.procurement);
    } else if (roll < 0.5) {
      await advanceShipmentTo(shipment.id, users.procurement, 'IN_TRANSIT');
    } else {
      await advanceShipmentTo(shipment.id, users.procurement, 'ARRIVED_AT_PORT');
    }

    processed += 1;
    if (processed % 25 === 0) console.log(`  shipments/receipts: ${processed}/${total} processed`);
  }

  // A handful of standalone shipments with no linked PO, for variety (schema allows this).
  const products = await prisma.product.findMany({ select: { id: true } });
  for (let i = 0; i < 5; i++) {
    const currency = 'USD';
    const rate = CURRENCY_RATES[currency];
    const items = [{ productId: randomChoice(products).id, quantity: randomInt(50, 200) }];
    const shipment = await shipmentsService.create({
      containerNumber: generateContainerNumber(),
      originPort: randomChoice(Object.values(PORT_BY_COUNTRY)),
      destinationPort: randomChoice(DESTINATION_PORTS),
      estimatedArrival: addDays(new Date(), randomInt(10, 30)),
      freightCost: randomInt(500, 3000),
      insuranceCost: randomInt(50, 300),
      dutyCost: randomInt(200, 1500),
      customsCharges: randomInt(100, 600),
      currency,
      exchangeRateToBase: rate,
      items,
    });
    if (Math.random() < 0.5) {
      await advanceShipmentTo(shipment.id, users.procurement, 'IN_TRANSIT');
    }
  }
  console.log('  standalone shipments: 5 created');

  // Manual stock adjustments — cycle-count corrections and damage write-offs — via the same
  // stockService.adjust() a real inventory-manager request would use, both to add realistic
  // ADJUSTMENT-type transactions and to help push total InventoryTransaction volume toward the
  // ~1000-row target once sales consumption (seeded later) is layered on top.
  const productsWithCost = await prisma.product.findMany({ select: { id: true, costPrice: true } });
  let positiveAdjustments = 0;
  for (let i = 0; i < 80; i++) {
    const product = randomChoice(productsWithCost);
    // Mostly the main warehouse (keeps sellable stock concentrated where confirm() draws
    // from), with an occasional secondary-warehouse adjustment purely for warehouse variety.
    const warehouseId =
      secondaryWarehouses.length > 0 && Math.random() < 0.15 ? randomChoice(secondaryWarehouses).id : mainWarehouse.id;
    await stockService.adjust({
      productId: product.id,
      warehouseId,
      quantityDelta: randomInt(15, 120),
      reason: 'Cycle count correction — additional stock located',
      lotNumber: `ADJ-${Date.now()}-${i}`,
      costPrice: product.costPrice,
    });
    positiveAdjustments += 1;
  }

  let negativeAdjustments = 0;
  let negativeAdjustmentsSkipped = 0;
  for (let i = 0; i < 25; i++) {
    const product = randomChoice(productsWithCost);
    const warehouseId = mainWarehouse.id;
    try {
      await stockService.adjust({
        productId: product.id,
        warehouseId,
        quantityDelta: -randomInt(5, 25),
        reason: 'Damaged stock written off during warehouse audit',
      });
      negativeAdjustments += 1;
    } catch (err) {
      if (err instanceof ApiError) {
        negativeAdjustmentsSkipped += 1;
      } else {
        throw err;
      }
    }
  }
  console.log(
    `  manual stock adjustments: ${positiveAdjustments} increases, ${negativeAdjustments} decreases ` +
      `(${negativeAdjustmentsSkipped} decrease attempts skipped for insufficient stock)`,
  );

  const [lotCount, txnCount] = await Promise.all([
    prisma.inventoryLot.count(),
    prisma.inventoryTransaction.count(),
  ]);
  const statuses = ['BOOKED', 'IN_TRANSIT', 'ARRIVED_AT_PORT', 'CUSTOMS_CLEARANCE', 'DELIVERED', 'DELAYED'] as const;
  const shipmentCounts = await Promise.all(statuses.map((status) => prisma.shipment.count({ where: { status } })));
  console.log(`  inventory lots: ${lotCount}, inventory transactions so far: ${txnCount}`);
  console.log(
    '  shipment status distribution:',
    statuses.map((status, i) => `${status}=${shipmentCounts[i]}`).join(', '),
  );

  const poStatuses = ['ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED'] as const;
  const poCounts = await Promise.all(poStatuses.map((status) => prisma.purchaseOrder.count({ where: { status } })));
  console.log(
    '  purchase order status after receiving:',
    poStatuses.map((status, i) => `${status}=${poCounts[i]}`).join(', '),
  );
}

/**
 * Called at the very end of main(), after every other domain has seeded — sales-order
 * confirmation (seedDistributorsAndSales, which runs after this file) is itself a major
 * source of InventoryTransaction rows (one per FIFO lot consumed per line item), so the true
 * final total is only known once everything else has run. Tops up with the same real
 * stockService.adjust() call used above if the ~1000-row target from the project spec isn't
 * naturally reached; idempotent (re-running with the target already met is a no-op).
 */
export async function topUpInventoryTransactions(targetTotal: number) {
  const current = await prisma.inventoryTransaction.count();
  if (current >= targetTotal) {
    console.log(`  inventory transactions: ${current} (target ${targetTotal} already met, no top-up needed)`);
    return;
  }

  const needed = targetTotal - current;
  const warehouses = await prisma.warehouse.findMany({ orderBy: { name: 'asc' } });
  const mainWarehouse = warehouses.find((w) => w.name === 'Karachi Main Warehouse') ?? warehouses[0];
  const products = await prisma.product.findMany({ select: { id: true, costPrice: true } });

  for (let i = 0; i < needed; i++) {
    const product = randomChoice(products);
    await stockService.adjust({
      productId: product.id,
      warehouseId: mainWarehouse.id,
      quantityDelta: randomInt(5, 40),
      reason: 'Year-end stock count top-up adjustment',
      lotNumber: `TOPUP-${Date.now()}-${i}`,
      costPrice: product.costPrice,
    });
    if ((i + 1) % 100 === 0) {
      console.log(`  top-up adjustments: ${i + 1}/${needed}`);
    }
  }
  console.log(`  inventory transactions topped up by ${needed} to reach target ${targetTotal}`);
}
