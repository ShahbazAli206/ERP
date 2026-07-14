import { prisma } from '../../src/database/prisma';
import { categoriesService } from '../../src/modules/inventory/categories.service';
import { warehousesService } from '../../src/modules/inventory/warehouses.service';
import { productsService } from '../../src/modules/inventory/products.service';
import { randomChoice, randomFloat, randomInt, round2 } from './helpers';

interface CategorySpec {
  name: string;
  skuPrefix: string;
  units: string[];
  costRange: [number, number];
  markupRange: [number, number];
  products: string[];
}

/** 8 categories x ~6 products = 50 products, matching an import/trading business's catalog. */
const CATEGORY_SPECS: CategorySpec[] = [
  {
    name: 'Electronics',
    skuPrefix: 'ELEC',
    units: ['pcs'],
    costRange: [3000, 45000],
    markupRange: [1.25, 1.5],
    products: [
      'LED Television 43-inch',
      'Bluetooth Wireless Earbuds',
      'Smartphone Power Bank 20000mAh',
      'Home Theater Sound System',
      'Digital Kitchen Weighing Scale',
      'LED Desk Lamp',
      'Wireless Dual-Band Router',
    ],
  },
  {
    name: 'Textiles & Apparel',
    skuPrefix: 'TEXT',
    units: ['pcs', 'set'],
    costRange: [400, 4000],
    markupRange: [1.3, 1.6],
    products: [
      'Cotton Bedsheet Set King Size',
      "Men's Formal Dress Shirt",
      "Ladies' Silk Scarf",
      'Winter Fleece Jacket',
      'Kids Cotton T-Shirt Pack',
      'Embroidered Table Linen Set',
    ],
  },
  {
    name: 'Food & Beverages',
    skuPrefix: 'FOOD',
    units: ['carton', 'box', 'kg'],
    costRange: [300, 3500],
    markupRange: [1.2, 1.4],
    products: [
      'Premium Basmati Rice 25kg',
      'Imported Olive Oil 1L',
      'Roasted Coffee Beans 500g',
      'Assorted Dry Fruits Pack 1kg',
      'Herbal Green Tea Box',
      'Cooking Spice Gift Set',
    ],
  },
  {
    name: 'Machinery & Tools',
    skuPrefix: 'MACH',
    units: ['pcs', 'set'],
    costRange: [15000, 180000],
    markupRange: [1.15, 1.35],
    products: [
      'Industrial Air Compressor',
      'Cordless Power Drill Set',
      'Hydraulic Bottle Jack 2-Ton',
      'Bench Grinder Machine',
      'Portable Generator 5kW',
      'Heavy Duty Tool Chest',
    ],
  },
  {
    name: 'Home & Furniture',
    skuPrefix: 'HOME',
    units: ['pcs', 'set'],
    costRange: [6000, 70000],
    markupRange: [1.2, 1.45],
    products: [
      'Wooden Dining Table Set',
      'Ergonomic Office Chair',
      '3-Seater Fabric Sofa',
      'Stainless Steel Cookware Set',
      'Memory Foam Mattress Queen',
      'Modular Kitchen Storage Rack',
    ],
  },
  {
    name: 'Automotive Parts',
    skuPrefix: 'AUTO',
    units: ['pcs', 'set'],
    costRange: [1500, 25000],
    markupRange: [1.25, 1.5],
    products: [
      'Car Brake Pad Set',
      'Engine Oil Filter',
      'Alloy Wheel Rim 16-inch',
      'Car Battery 12V 65Ah',
      'LED Headlight Kit',
      'Car Seat Cover Set',
    ],
  },
  {
    name: 'Pharmaceuticals & Healthcare',
    skuPrefix: 'PHAR',
    units: ['pcs', 'box'],
    costRange: [250, 4000],
    markupRange: [1.3, 1.6],
    products: [
      'Digital Blood Pressure Monitor',
      'First Aid Kit Deluxe',
      'Vitamin C Supplement Bottle',
      'N95 Face Mask Box',
      'Infrared Thermometer',
      'Orthopedic Back Support Belt',
    ],
  },
  {
    name: 'Consumer Goods & Personal Care',
    skuPrefix: 'CONS',
    units: ['pcs'],
    costRange: [300, 6000],
    markupRange: [1.3, 1.6],
    products: [
      'Herbal Shampoo 400ml',
      'Electric Rechargeable Shaver',
      'Luxury Perfume 100ml',
      'Kids Toy Building Blocks Set',
      'Ceramic Dinner Set 16-Piece',
      'Travel Trolley Bag 24-inch',
      'Stainless Steel Vacuum Flask',
    ],
  },
];

const WAREHOUSE_SPECS = [
  { name: 'Karachi Main Warehouse', location: 'Karachi, Sindh' },
  { name: 'Lahore Regional Warehouse', location: 'Lahore, Punjab' },
  { name: 'Islamabad Depot', location: 'Islamabad, Capital Territory' },
];

export async function seedCatalog() {
  const existing = await prisma.product.count();
  if (existing > 0) {
    console.log('  Catalog already seeded, skipping');
    return;
  }

  const categoryIds = new Map<string, string>();
  for (const spec of CATEGORY_SPECS) {
    const category = await categoriesService.create({ name: spec.name });
    categoryIds.set(spec.name, category.id);
  }
  console.log(`  categories: ${CATEGORY_SPECS.length} created`);

  for (const warehouse of WAREHOUSE_SPECS) {
    await warehousesService.create(warehouse);
  }
  console.log(`  warehouses: ${WAREHOUSE_SPECS.length} created`);

  let globalIndex = 1;
  let productCount = 0;
  for (const spec of CATEGORY_SPECS) {
    let seq = 1;
    for (const productName of spec.products) {
      const costPrice = round2(randomFloat(spec.costRange[0], spec.costRange[1]));
      const markup = randomFloat(spec.markupRange[0], spec.markupRange[1]);
      const sellingPrice = round2(costPrice * markup);
      await productsService.create({
        sku: `${spec.skuPrefix}-${String(seq).padStart(4, '0')}`,
        barcode: `20000000${String(globalIndex).padStart(5, '0')}`,
        name: productName,
        description: `${productName} — imported ${spec.name.toLowerCase()} item.`,
        categoryId: categoryIds.get(spec.name),
        unit: randomChoice(spec.units),
        costPrice,
        sellingPrice,
        reorderLevel: randomInt(10, 50),
        isActive: true,
      });
      seq += 1;
      globalIndex += 1;
      productCount += 1;
    }
  }
  console.log(`  products: ${productCount} created`);
}
