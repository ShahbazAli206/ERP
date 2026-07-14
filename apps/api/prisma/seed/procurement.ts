import { prisma } from '../../src/database/prisma';
import { procurementService } from '../../src/modules/procurement/procurement.service';
import { suppliersService } from '../../src/modules/suppliers/suppliers.service';
import {
  addDays,
  CURRENCY_RATES,
  DemoUsers,
  randomChoice,
  randomChoices,
  randomFloat,
  randomHistoricalDate,
  randomInt,
  round2,
  shuffle,
} from './helpers';

interface SupplierSpec {
  name: string;
  country: string;
  currency: string;
}

/** 20 suppliers across a deliberately varied set of countries/currencies. */
const SUPPLIER_SPECS: SupplierSpec[] = [
  { name: 'Shenzhen Yida Electronics Co., Ltd.', country: 'China', currency: 'CNY' },
  { name: 'Al Habtoor General Trading LLC', country: 'United Arab Emirates', currency: 'AED' },
  { name: 'Bavaria Industrial Maschinen GmbH', country: 'Germany', currency: 'EUR' },
  { name: 'Liberty Machine Parts Inc.', country: 'United States', currency: 'USD' },
  { name: 'Anatolia Tekstil A.S.', country: 'Turkey', currency: 'TRY' },
  { name: 'Mekong Delta Exports Co.', country: 'Vietnam', currency: 'VND' },
  { name: 'Milano Design Furnishings S.r.l.', country: 'Italy', currency: 'EUR' },
  { name: 'Thames Valley Trading Ltd.', country: 'United Kingdom', currency: 'GBP' },
  { name: 'Hanguk Precision Co., Ltd.', country: 'South Korea', currency: 'KRW' },
  { name: 'Selangor Commodities Sdn Bhd', country: 'Malaysia', currency: 'MYR' },
  { name: 'Bangkok Textile House Co., Ltd.', country: 'Thailand', currency: 'THB' },
  { name: 'Kanto Machinery Co., Ltd.', country: 'Japan', currency: 'JPY' },
  { name: 'Al Faisal Trading Establishment', country: 'Saudi Arabia', currency: 'SAR' },
  { name: 'Java Furniture Exports PT', country: 'Indonesia', currency: 'IDR' },
  { name: 'Dhaka Garments Ltd.', country: 'Bangladesh', currency: 'BDT' },
  { name: 'Amsterdam Foods B.V.', country: 'Netherlands', currency: 'EUR' },
  { name: 'Barcelona Ceramics S.A.', country: 'Spain', currency: 'EUR' },
  { name: 'Marina Trading Pte Ltd', country: 'Singapore', currency: 'SGD' },
  { name: 'Taipei Electronics Corp.', country: 'Taiwan', currency: 'TWD' },
  { name: 'Provence Cosmetics S.A.R.L.', country: 'France', currency: 'EUR' },
];

const CONTACT_NAMES = [
  'Ahmed Rasheed',
  'Li Wei',
  'Fatima Al Zahra',
  'John Whitfield',
  'Mehmet Yildiz',
  'Nguyen Van An',
  'Giulia Rossi',
  'James Carter',
  'Park Jin-ho',
  'Siti Aminah',
];

const REJECTION_REASONS = [
  'Pricing no longer competitive versus alternate suppliers',
  'Budget constraints for this quarter',
  'Supplier failed compliance/quality audit',
  'Duplicate order raised in error',
  'Product specifications changed after order was drafted',
];

type PoPlan = 'DRAFT' | 'PENDING_APPROVAL' | 'REJECTED' | 'CANCELLED_EARLY' | 'CANCELLED_LATE' | 'ORDERED';

const POS_TOTAL = 100;

function buildPlans(): PoPlan[] {
  const plans: PoPlan[] = [
    ...(Array(8).fill('DRAFT') as PoPlan[]),
    ...(Array(5).fill('PENDING_APPROVAL') as PoPlan[]),
    ...(Array(5).fill('REJECTED') as PoPlan[]),
    ...(Array(3).fill('CANCELLED_EARLY') as PoPlan[]),
    ...(Array(2).fill('CANCELLED_LATE') as PoPlan[]),
    ...(Array(77).fill('ORDERED') as PoPlan[]),
  ];
  return shuffle(plans);
}

export async function seedSuppliersAndProcurement(users: DemoUsers) {
  const existingSuppliers = await prisma.supplier.count();
  if (existingSuppliers > 0) {
    console.log('  Suppliers/purchase orders already seeded, skipping');
    return;
  }

  const supplierIds: string[] = [];
  for (const spec of SUPPLIER_SPECS) {
    const domain = spec.name
      .toLowerCase()
      .replace(/[^a-z]+/g, '')
      .slice(0, 20);
    const supplier = await suppliersService.create({
      name: spec.name,
      country: spec.country,
      currency: spec.currency,
      address: `${spec.name}, ${spec.country}`,
      isActive: true,
      contacts: [
        {
          name: randomChoice(CONTACT_NAMES),
          designation: randomChoice(['Export Manager', 'Sales Director', 'Account Executive']),
          email: `contact@${domain}.com`,
          phone: `+${randomInt(1, 99)}-${randomInt(100, 999)}-${randomInt(1000000, 9999999)}`,
        },
      ],
    });
    supplierIds.push(supplier.id);
  }
  console.log(`  suppliers: ${supplierIds.length} created`);

  const products = await prisma.product.findMany({ select: { id: true, costPrice: true } });
  const plans = buildPlans();

  let poCount = 0;
  for (let i = 0; i < POS_TOTAL; i++) {
    const supplierIdx = randomInt(0, SUPPLIER_SPECS.length - 1);
    const supplierId = supplierIds[supplierIdx];
    const currency = SUPPLIER_SPECS[supplierIdx].currency;
    const rate = CURRENCY_RATES[currency];

    const lineProducts = randomChoices(products, randomInt(1, 4));
    const items = lineProducts.map((p) => ({
      productId: p.id,
      quantity: randomInt(40, 350),
      unitPrice: round2((p.costPrice / rate) * randomFloat(0.9, 1.1)),
    }));

    const orderDate = randomHistoricalDate();
    const expectedArrival = addDays(orderDate, randomInt(20, 60));

    const created = await procurementService.create(
      {
        supplierId,
        currency,
        exchangeRateToBase: rate,
        expectedArrival,
        items,
      },
      users.procurement,
    );

    // procurementService.create() always stamps orderDate = now(); backfill the historical
    // date directly since the service's DTO never exposes it as an input field.
    await prisma.purchaseOrder.update({ where: { id: created.id }, data: { orderDate } });

    const plan = plans[i];
    switch (plan) {
      case 'DRAFT':
        break;
      case 'PENDING_APPROVAL':
        await procurementService.submit(created.id, users.procurement);
        break;
      case 'REJECTED':
        await procurementService.submit(created.id, users.procurement);
        await procurementService.reject(created.id, users.procurement, randomChoice(REJECTION_REASONS));
        break;
      case 'CANCELLED_EARLY':
        await procurementService.cancel(created.id, users.procurement);
        break;
      case 'CANCELLED_LATE':
        await procurementService.submit(created.id, users.procurement);
        await procurementService.approve(created.id, users.procurement);
        await procurementService.markOrdered(created.id, users.procurement);
        await procurementService.cancel(created.id, users.procurement);
        break;
      case 'ORDERED':
        await procurementService.submit(created.id, users.procurement);
        await procurementService.approve(created.id, users.procurement);
        await procurementService.markOrdered(created.id, users.procurement);
        break;
    }

    poCount += 1;
    if (poCount % 25 === 0) {
      console.log(`  purchase orders: ${poCount}/${POS_TOTAL} processed`);
    }
  }

  const statuses = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'] as const;
  const counts = await Promise.all(statuses.map((status) => prisma.purchaseOrder.count({ where: { status } })));
  console.log(
    '  purchase order status distribution:',
    statuses.map((status, i) => `${status}=${counts[i]}`).join(', '),
  );
}
