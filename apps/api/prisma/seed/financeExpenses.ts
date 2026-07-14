import { prisma } from '../../src/database/prisma';
import { accountsService } from '../../src/modules/finance/accounts.service';
import { bankAccountsService } from '../../src/modules/finance/bankAccounts.service';
import { journalEntriesService } from '../../src/modules/finance/journalEntries.service';
import { expenseCategoriesService } from '../../src/modules/expenses/expenseCategories.service';
import { expensesService } from '../../src/modules/expenses/expenses.service';
import { AccountType } from '../../src/generated/prisma/enums';
import { DemoUsers, randomDateInMonthsAgo, randomFloat, round2 } from './helpers';

interface AccountSpec {
  code: string;
  name: string;
  type: AccountType;
}

const ACCOUNT_SPECS: AccountSpec[] = [
  { code: '1000', name: 'Cash on Hand', type: AccountType.ASSET },
  { code: '1010', name: 'Main Operating Account - Bank', type: AccountType.ASSET },
  { code: '1020', name: 'Trade Reserve Account - Bank', type: AccountType.ASSET },
  { code: '1030', name: 'Accounts Receivable', type: AccountType.ASSET },
  { code: '1040', name: 'Inventory', type: AccountType.ASSET },
  { code: '1050', name: 'Prepaid Expenses', type: AccountType.ASSET },
  { code: '2000', name: 'Accounts Payable', type: AccountType.LIABILITY },
  { code: '2010', name: 'Taxes Payable', type: AccountType.LIABILITY },
  { code: '2020', name: 'Accrued Salaries', type: AccountType.LIABILITY },
  { code: '3000', name: "Owner's Equity", type: AccountType.EQUITY },
  { code: '3010', name: 'Retained Earnings', type: AccountType.EQUITY },
  { code: '4000', name: 'Sales Revenue', type: AccountType.INCOME },
  { code: '4010', name: 'Other Income', type: AccountType.INCOME },
  { code: '5000', name: 'Cost of Goods Sold', type: AccountType.EXPENSE },
  { code: '5010', name: 'Rent Expense', type: AccountType.EXPENSE },
  { code: '5020', name: 'Salaries & Wages Expense', type: AccountType.EXPENSE },
  { code: '5030', name: 'Utilities Expense', type: AccountType.EXPENSE },
  { code: '5040', name: 'Marketing & Advertising Expense', type: AccountType.EXPENSE },
  { code: '5050', name: 'Transport & Logistics Expense', type: AccountType.EXPENSE },
  { code: '5060', name: 'Office Supplies Expense', type: AccountType.EXPENSE },
  { code: '5070', name: 'Bank Charges & Fees', type: AccountType.EXPENSE },
  { code: '5080', name: 'Import Duties & Customs Expense', type: AccountType.EXPENSE },
];

const EXPENSE_CATEGORY_NAMES = [
  'Rent',
  'Salaries & Wages',
  'Utilities',
  'Marketing & Advertising',
  'Transport & Logistics',
  'Office Supplies',
  'Bank Charges & Fees',
  'Miscellaneous',
];

export async function seedFinanceAndExpenses(users: DemoUsers) {
  const existing = await prisma.account.count();
  if (existing > 0) {
    console.log('  Finance/expenses already seeded, skipping');
    return;
  }

  const accountIds = new Map<string, string>();
  for (const spec of ACCOUNT_SPECS) {
    const account = await accountsService.create(spec);
    accountIds.set(spec.code, account.id);
  }
  console.log(`  chart of accounts: ${ACCOUNT_SPECS.length} accounts created`);

  // Bank balances below are seeded STARTING balances, not derived from the ledger. Confirmed
  // nothing in this codebase's finance module auto-updates BankAccount.balance from Payments
  // or JournalLines (invoicesService.recordPayment only touches Payment/Invoice rows, and
  // there is no service at all for outgoing supplier payments) — a static opening balance is
  // the choice most consistent with how the rest of the app actually works today.
  await bankAccountsService.create({
    name: 'Main Operating Account',
    bankName: 'Habib Bank Limited',
    accountNumber: 'HBL-0142-3390021',
    currency: 'PKR',
    balance: 8000000,
  });
  await bankAccountsService.create({
    name: 'Trade Reserve Account',
    bankName: 'Meezan Bank',
    accountNumber: 'MZN-0087-1145567',
    currency: 'PKR',
    balance: 3500000,
  });
  console.log('  bank accounts: 2 created');

  const categoryIds = new Map<string, string>();
  for (const name of EXPENSE_CATEGORY_NAMES) {
    const category = await expenseCategoriesService.create({ name });
    categoryIds.set(name, category.id);
  }
  console.log(`  expense categories: ${EXPENSE_CATEGORY_NAMES.length} created`);

  let expenseCount = 0;
  let journalCount = 0;

  for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
    const monthProgress = 11 - monthsAgo; // 0 (oldest) .. 11 (current)

    const rentAmount = round2(155000 + randomFloat(-5000, 15000));
    await expensesService.create(
      {
        categoryId: categoryIds.get('Rent')!,
        amount: rentAmount,
        description: 'Monthly warehouse and office rent',
        expenseDate: randomDateInMonthsAgo(monthsAgo),
      },
      users.accountant,
    );

    const salaryAmount = round2(550000 + monthProgress * 9000 + randomFloat(-10000, 10000));
    await expensesService.create(
      {
        categoryId: categoryIds.get('Salaries & Wages')!,
        amount: salaryAmount,
        description: 'Staff salaries and wages',
        expenseDate: randomDateInMonthsAgo(monthsAgo),
      },
      users.accountant,
    );

    const utilitiesAmount = round2(randomFloat(40000, 90000));
    await expensesService.create(
      {
        categoryId: categoryIds.get('Utilities')!,
        amount: utilitiesAmount,
        description: 'Electricity, gas and water bills',
        expenseDate: randomDateInMonthsAgo(monthsAgo),
      },
      users.accountant,
    );

    const marketingAmount = round2(randomFloat(20000, 150000));
    await expensesService.create(
      {
        categoryId: categoryIds.get('Marketing & Advertising')!,
        amount: marketingAmount,
        description: 'Promotions and advertising spend',
        expenseDate: randomDateInMonthsAgo(monthsAgo),
      },
      users.accountant,
    );

    const transportAmount = round2(randomFloat(50000, 120000));
    await expensesService.create(
      {
        categoryId: categoryIds.get('Transport & Logistics')!,
        amount: transportAmount,
        description: 'Local freight and distribution transport',
        expenseDate: randomDateInMonthsAgo(monthsAgo),
      },
      users.accountant,
    );

    const officeAmount = round2(randomFloat(10000, 40000));
    await expensesService.create(
      {
        categoryId: categoryIds.get('Office Supplies')!,
        amount: officeAmount,
        description: 'Stationery and office consumables',
        expenseDate: randomDateInMonthsAgo(monthsAgo),
      },
      users.accountant,
    );

    const bankChargesAmount = round2(randomFloat(5000, 15000));
    await expensesService.create(
      {
        categoryId: categoryIds.get('Bank Charges & Fees')!,
        amount: bankChargesAmount,
        description: 'Bank service charges and transfer fees',
        expenseDate: randomDateInMonthsAgo(monthsAgo),
      },
      users.accountant,
    );

    expenseCount += 7;

    if (Math.random() < 0.5) {
      const miscAmount = round2(randomFloat(5000, 30000));
      await expensesService.create(
        {
          categoryId: categoryIds.get('Miscellaneous')!,
          amount: miscAmount,
          description: 'Miscellaneous operating expense',
          expenseDate: randomDateInMonthsAgo(monthsAgo),
        },
        users.accountant,
      );
      expenseCount += 1;
    }

    // Balanced journal entries mirroring the same monthly operating costs — debits=credits,
    // >=2 lines, via journalEntriesService.create()'s real double-entry guard.
    const entryDate = randomDateInMonthsAgo(monthsAgo);
    await journalEntriesService.create({
      entryDate,
      description: `Rent accrual for month ${monthProgress + 1}`,
      reference: `JE-RENT-${monthsAgo}`,
      lines: [
        { accountId: accountIds.get('5010')!, debit: rentAmount, credit: 0 },
        { accountId: accountIds.get('2000')!, debit: 0, credit: rentAmount },
      ],
    });
    await journalEntriesService.create({
      entryDate,
      description: `Salaries and wages for month ${monthProgress + 1}`,
      reference: `JE-SAL-${monthsAgo}`,
      lines: [
        { accountId: accountIds.get('5020')!, debit: salaryAmount, credit: 0 },
        { accountId: accountIds.get('1010')!, debit: 0, credit: salaryAmount },
      ],
    });
    await journalEntriesService.create({
      entryDate,
      description: `Utilities and transport for month ${monthProgress + 1}`,
      reference: `JE-OPEX-${monthsAgo}`,
      lines: [
        { accountId: accountIds.get('5030')!, debit: utilitiesAmount, credit: 0 },
        { accountId: accountIds.get('5050')!, debit: transportAmount, credit: 0 },
        { accountId: accountIds.get('1010')!, debit: 0, credit: round2(utilitiesAmount + transportAmount) },
      ],
    });
    journalCount += 3;

    console.log(`  finance/expenses: month ${monthProgress + 1}/12 seeded`);
  }

  console.log(`  expenses: ${expenseCount} created, journal entries: ${journalCount} created`);
}
