import { prisma } from '../../src/database/prisma';
import { taxService } from '../../src/modules/tax/tax.service';
import { companySettingsService } from '../../src/modules/settings/companySettings.service';
import { exchangeRatesService } from '../../src/modules/settings/exchangeRates.service';
import { TaxType } from '../../src/generated/prisma/enums';
import { CURRENCY_RATES } from './helpers';

const TAX_SPECS = [
  { name: 'Standard GST', type: TaxType.GST, rate: 18, appliesTo: 'General sales of goods', isActive: true },
  { name: 'Sales Tax on Services', type: TaxType.SALES_TAX, rate: 15, appliesTo: 'Services', isActive: true },
  {
    name: 'Withholding Tax - Supplier Payments',
    type: TaxType.WITHHOLDING_TAX,
    rate: 4.5,
    appliesTo: 'Supplier payments',
    isActive: true,
  },
  {
    name: 'Legacy GST (Pre-2025)',
    type: TaxType.GST,
    rate: 17,
    appliesTo: 'General sales of goods (superseded)',
    isActive: false,
  },
];

export async function seedTaxAndSettings() {
  const existing = await prisma.tax.count();
  if (existing > 0) {
    console.log('  Tax/settings already seeded, skipping');
    return;
  }

  for (const spec of TAX_SPECS) {
    await taxService.create(spec);
  }
  console.log(`  tax rates: ${TAX_SPECS.length} created`);

  await companySettingsService.update({
    companyName: 'Meridian Gateway Trading Co. (Pvt) Ltd.',
    address: 'Plot 14, Sector 22, Korangi Industrial Area, Karachi, Pakistan',
    phone: '+92-21-3550-9871',
    email: 'info@meridiangateway.pk',
    baseCurrency: 'PKR',
  });
  console.log('  company settings: updated');

  const currencies = Object.keys(CURRENCY_RATES).filter((code) => code !== 'PKR');
  for (const code of currencies) {
    await exchangeRatesService.update(code, { rateToBase: CURRENCY_RATES[code] });
  }
  console.log(`  exchange rates: ${currencies.length} currency pairs seeded`);
}
