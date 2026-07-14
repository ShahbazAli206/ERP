import { prisma } from '../../src/database/prisma';
import { distributorsService } from '../../src/modules/distributors/distributors.service';
import { pricingGroupsService } from '../../src/modules/distributors/pricingGroups.service';
import { salesOrdersService } from '../../src/modules/sales/salesOrders.service';
import { invoicesService } from '../../src/modules/sales/invoices.service';
import { returnsService } from '../../src/modules/sales/returns.service';
import { ApiError } from '../../src/shared/ApiError';
import { PaymentMethod } from '../../src/generated/prisma/enums';
import {
  addDays,
  addDaysClamped,
  DemoUsers,
  randomChoice,
  randomChoices,
  randomFloat,
  randomHistoricalDate,
  randomInt,
  round2,
  shuffle,
} from './helpers';

interface DistributorSpec {
  name: string;
  region: string;
}

/** 15 distributors across a spread of Pakistani regions/cities. */
const DISTRIBUTOR_SPECS: DistributorSpec[] = [
  { name: 'Karachi Traders Hub', region: 'Karachi' },
  { name: 'Lahore Wholesale Mart', region: 'Lahore' },
  { name: 'Islamabad Retail Partners', region: 'Islamabad' },
  { name: 'Rawalpindi Cash & Carry', region: 'Rawalpindi' },
  { name: 'Faisalabad Textile Distributors', region: 'Faisalabad' },
  { name: 'Multan General Store Network', region: 'Multan' },
  { name: 'Peshawar Frontier Traders', region: 'Peshawar' },
  { name: 'Quetta Balochistan Suppliers', region: 'Quetta' },
  { name: 'Sialkot Export Linked Distributors', region: 'Sialkot' },
  { name: 'Gujranwala Hardware Distributors', region: 'Gujranwala' },
  { name: 'Hyderabad Sindh Traders', region: 'Hyderabad' },
  { name: 'Sukkur Regional Wholesalers', region: 'Sukkur' },
  { name: 'Bahawalpur South Punjab Traders', region: 'Bahawalpur' },
  { name: 'Sargodha Citrus Belt Distributors', region: 'Sargodha' },
  { name: 'Abbottabad Hazara Traders', region: 'Abbottabad' },
];

const CONTACT_NAMES = [
  'Ali Hassan',
  'Sana Sheikh',
  'Kamran Butt',
  'Nadia Yousuf',
  'Imran Qureshi',
  'Ayesha Malik',
  'Tariq Javed',
  'Rabia Chaudhry',
  'Waqas Aslam',
  'Sadia Bibi',
];

const RETURN_REASONS = [
  'Damaged in transit',
  'Wrong item delivered',
  'Customer changed order',
  'Quality defect found on inspection',
];

const PAYMENT_METHODS = [PaymentMethod.BANK_TRANSFER, PaymentMethod.CASH, PaymentMethod.CHEQUE, PaymentMethod.CARD] as const;

const SALES_ORDERS_TOTAL = 300;

type SoPlan =
  | 'CANCEL_DRAFT'
  | 'CANCEL_AFTER_CONFIRM'
  | 'CANCEL_AFTER_PROCESSING'
  | 'STOP_CONFIRMED'
  | 'STOP_PROCESSING'
  | 'STOP_SHIPPED'
  | 'DELIVER';

function buildPlans(): SoPlan[] {
  const plans: SoPlan[] = [
    ...(Array(8).fill('CANCEL_DRAFT') as SoPlan[]),
    ...(Array(7).fill('CANCEL_AFTER_CONFIRM') as SoPlan[]),
    ...(Array(5).fill('CANCEL_AFTER_PROCESSING') as SoPlan[]),
    ...(Array(25).fill('STOP_CONFIRMED') as SoPlan[]),
    ...(Array(25).fill('STOP_PROCESSING') as SoPlan[]),
    ...(Array(30).fill('STOP_SHIPPED') as SoPlan[]),
    ...(Array(200).fill('DELIVER') as SoPlan[]),
  ];
  return shuffle(plans);
}

export async function seedDistributorsAndSales(users: DemoUsers) {
  const existing = await prisma.salesOrder.count();
  if (existing > 0) {
    console.log('  Distributors/sales orders already seeded, skipping');
    return;
  }

  const pricingGroupSpecs = [
    { name: 'Standard Retail', discountPercent: 0 },
    { name: 'Preferred Partner', discountPercent: 5 },
    { name: 'Strategic Wholesale', discountPercent: 10 },
  ];
  const pricingGroupIds: string[] = [];
  for (const spec of pricingGroupSpecs) {
    const group = await pricingGroupsService.create(spec);
    pricingGroupIds.push(group.id);
  }
  console.log(`  pricing groups: ${pricingGroupIds.length} created`);

  const distributorIds: string[] = [];
  for (const spec of DISTRIBUTOR_SPECS) {
    // Weighted: half Standard, ~30% Preferred, ~20% Strategic.
    const roll = Math.random();
    const pricingGroupId = roll < 0.5 ? pricingGroupIds[0] : roll < 0.8 ? pricingGroupIds[1] : pricingGroupIds[2];
    const contactName = randomChoice(CONTACT_NAMES);
    const domain = spec.name.toLowerCase().replace(/[^a-z]+/g, '');
    const distributor = await distributorsService.create({
      name: spec.name,
      region: spec.region,
      creditLimit: randomInt(300000, 5000000),
      pricingGroupId,
      contactName,
      contactEmail: `${contactName.toLowerCase().replace(/\s+/g, '.')}@${domain}.pk`,
      contactPhone: `+92-3${randomInt(0, 9)}-${randomInt(1000000, 9999999)}`,
      address: `${spec.region}, Pakistan`,
      isActive: true,
    });
    distributorIds.push(distributor.id);
  }
  console.log(`  distributors: ${distributorIds.length} created`);

  const mainWarehouse = await prisma.warehouse.findFirstOrThrow({ where: { name: 'Karachi Main Warehouse' } });
  const products = await prisma.product.findMany({ select: { id: true, sellingPrice: true } });
  const plans = buildPlans();

  let processed = 0;
  let stockFailures = 0;
  let invoicesCreated = 0;
  let returnsCreated = 0;

  for (let i = 0; i < SALES_ORDERS_TOTAL; i++) {
    const distributorId = randomChoice(distributorIds);
    const lineProducts = randomChoices(products, randomInt(1, 5));
    const items = lineProducts.map((p) => ({
      productId: p.id,
      quantity: randomInt(5, 55),
      unitPrice: round2(p.sellingPrice * randomFloat(0.95, 1.05)),
      discount: randomChoice([0, 0, 0, 5, 10]),
    }));
    const discountPercent = randomChoice([0, 0, 0, 5, 10]);

    const created = await salesOrdersService.create({ distributorId, currency: 'PKR', discountPercent, items }, users.sales);

    const orderDate = randomHistoricalDate();
    await prisma.salesOrder.update({ where: { id: created.id }, data: { orderDate } });

    const plan = plans[i];

    if (plan === 'CANCEL_DRAFT') {
      await salesOrdersService.cancel(created.id, users.sales);
      processed += 1;
      if (processed % 50 === 0) console.log(`  sales orders: ${processed}/${SALES_ORDERS_TOTAL} processed`);
      continue;
    }

    let confirmed = false;
    try {
      await salesOrdersService.confirm(created.id, users.sales, mainWarehouse.id);
      confirmed = true;
    } catch (err) {
      if (err instanceof ApiError) {
        stockFailures += 1;
      } else {
        throw err;
      }
    }

    if (!confirmed) {
      // Left as DRAFT — an order that couldn't be fulfilled from current stock. Handled
      // gracefully rather than retried, per the task's guidance.
      processed += 1;
      if (processed % 50 === 0) console.log(`  sales orders: ${processed}/${SALES_ORDERS_TOTAL} processed`);
      continue;
    }

    let finalStatus: 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' = 'CONFIRMED';

    if (plan === 'CANCEL_AFTER_CONFIRM') {
      await salesOrdersService.cancel(created.id, users.sales);
      finalStatus = 'CANCELLED';
    } else if (plan === 'CANCEL_AFTER_PROCESSING') {
      await salesOrdersService.advance(created.id, users.sales);
      await salesOrdersService.cancel(created.id, users.sales);
      finalStatus = 'CANCELLED';
    } else if (plan === 'STOP_PROCESSING') {
      await salesOrdersService.advance(created.id, users.sales);
      finalStatus = 'PROCESSING';
    } else if (plan === 'STOP_SHIPPED') {
      await salesOrdersService.advance(created.id, users.sales);
      await salesOrdersService.advance(created.id, users.sales);
      finalStatus = 'SHIPPED';
    } else if (plan === 'DELIVER') {
      await salesOrdersService.advance(created.id, users.sales);
      await salesOrdersService.advance(created.id, users.sales);
      await salesOrdersService.advance(created.id, users.sales);
      finalStatus = 'DELIVERED';
    }
    // STOP_CONFIRMED: no further action, order stays at CONFIRMED.

    if (finalStatus === 'SHIPPED' || finalStatus === 'DELIVERED') {
      const invoice = await invoicesService.create({ salesOrderId: created.id, dueInDays: 30 });
      const issueDate = addDaysClamped(orderDate, randomInt(2, 12));
      const dueDate = addDays(issueDate, randomInt(20, 45));
      await prisma.invoice.update({ where: { id: invoice.id }, data: { issueDate, dueDate } });
      invoicesCreated += 1;

      const paymentRoll = Math.random();
      if (paymentRoll < 0.4) {
        await invoicesService.recordPayment(invoice.id, {
          amount: invoice.totalAmount,
          method: randomChoice(PAYMENT_METHODS),
          paymentDate: addDaysClamped(issueDate, randomInt(1, 20)),
          reference: `RCPT-${created.orderNumber}`,
        });
      } else if (paymentRoll < 0.7) {
        await invoicesService.recordPayment(invoice.id, {
          amount: round2(invoice.totalAmount * randomFloat(0.3, 0.7)),
          method: randomChoice(PAYMENT_METHODS),
          paymentDate: addDaysClamped(issueDate, randomInt(1, 20)),
          reference: `RCPT-${created.orderNumber}`,
        });
      }
      // else (remaining 30%): left fully unpaid, for receivables-aging variety.

      // Nothing in the app auto-transitions invoices to OVERDUE — flag genuinely past-due,
      // still-unpaid/partially-paid invoices directly. Purely a cosmetic label: confirmed
      // that receivables/income aggregates treat OVERDUE the same as ISSUED/PARTIALLY_PAID
      // (anything not CANCELLED/DRAFT), so this has no other side effects.
      if (dueDate.getTime() < Date.now()) {
        const refreshed = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
        if (refreshed.status === 'ISSUED' || refreshed.status === 'PARTIALLY_PAID') {
          await prisma.invoice.update({ where: { id: invoice.id }, data: { status: 'OVERDUE' } });
        }
      }

      if (finalStatus === 'DELIVERED' && returnsCreated < 12 && Math.random() < 0.07) {
        const returnedItem = randomChoice(created.items);
        const returnQty = Math.min(returnedItem.quantity, randomInt(1, 3));
        try {
          const salesReturn = await returnsService.createReturn({
            salesOrderId: created.id,
            productId: returnedItem.productId,
            quantity: returnQty,
            reason: randomChoice(RETURN_REASONS),
            restock: { warehouseId: mainWarehouse.id, lotNumber: `RET-${created.orderNumber}` },
          });
          await returnsService.createCreditNote({ salesReturnId: salesReturn.id });
          returnsCreated += 1;
        } catch (err) {
          if (!(err instanceof ApiError)) throw err;
        }
      }
    }

    processed += 1;
    if (processed % 50 === 0) {
      console.log(`  sales orders: ${processed}/${SALES_ORDERS_TOTAL} processed`);
    }
  }

  console.log(
    `  sales orders complete: ${processed} processed, ${stockFailures} confirm attempts skipped for insufficient stock, ` +
      `${invoicesCreated} invoices created, ${returnsCreated} returns/credit notes created`,
  );

  const statuses = ['DRAFT', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;
  const counts = await Promise.all(statuses.map((status) => prisma.salesOrder.count({ where: { status } })));
  console.log('  sales order status distribution:', statuses.map((status, i) => `${status}=${counts[i]}`).join(', '));

  const invoiceStatuses = ['DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'] as const;
  const invoiceCounts = await Promise.all(invoiceStatuses.map((status) => prisma.invoice.count({ where: { status } })));
  console.log(
    '  invoice status distribution:',
    invoiceStatuses.map((status, i) => `${status}=${invoiceCounts[i]}`).join(', '),
  );
}
