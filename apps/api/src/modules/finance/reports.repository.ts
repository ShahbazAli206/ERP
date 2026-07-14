import { prisma } from '../../database/prisma';

export const reportsRepository = {
  allDistributors() {
    return prisma.distributor.findMany({ select: { id: true, name: true } });
  },

  allSuppliers() {
    return prisma.supplier.findMany({ select: { id: true, name: true } });
  },

  bankAccountsBalanceSum() {
    return prisma.bankAccount.aggregate({ _sum: { balance: true } });
  },

  incomeInRange(from: Date, to: Date) {
    return prisma.invoice.aggregate({
      where: { issueDate: { gte: from, lte: to }, status: { not: 'CANCELLED' } },
      _sum: { totalAmount: true },
    });
  },

  expensesInRange(from: Date, to: Date) {
    return prisma.expense.aggregate({
      where: { expenseDate: { gte: from, lte: to } },
      _sum: { amount: true },
    });
  },

  // Simplified demo approximation of cost of goods sold — real COGS accounting would tie back
  // to the specific inventory lots consumed rather than the product's current cost price.
  deliveredSalesOrderItemsInRange(from: Date, to: Date) {
    return prisma.salesOrderItem.findMany({
      where: { salesOrder: { status: 'DELIVERED', orderDate: { gte: from, lte: to } } },
      select: { quantity: true, product: { select: { costPrice: true } } },
    });
  },

  inventoryLotsValuation() {
    return prisma.inventoryLot.findMany({ select: { quantity: true, costPrice: true } });
  },

  paymentsInRange(from: Date, to: Date, direction: 'INCOMING' | 'OUTGOING') {
    return prisma.payment.findMany({
      where: { direction, paymentDate: { gte: from, lte: to } },
      select: { amount: true, paymentDate: true },
    });
  },
};
