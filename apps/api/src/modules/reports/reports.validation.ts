import { z } from 'zod';
import { PurchaseOrderStatus, SalesOrderStatus } from '../../generated/prisma/enums';
import { paginationSchema } from '../../shared/pagination';

// Inclusive of the entire "to" day — a bare date string like "2026-07-14" coerces to midnight,
// which would otherwise exclude same-day records. Mirrors the identical fix already applied in
// finance/reports.validation.ts, dashboard/dashboard.validation.ts and
// expenses/expenses.validation.ts (this module doesn't import theirs directly for the
// sales/purchase schemas since it also needs to merge in pagination + extra filters).
function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

const inclusiveToDate = z.coerce.date().transform(endOfDay);

export const salesReportQuerySchema = paginationSchema.extend({
  from: z.coerce.date(),
  to: inclusiveToDate,
  status: z.nativeEnum(SalesOrderStatus).optional(),
  distributorId: z.string().optional(),
});

export const purchaseReportQuerySchema = paginationSchema.extend({
  from: z.coerce.date(),
  to: inclusiveToDate,
  status: z.nativeEnum(PurchaseOrderStatus).optional(),
  supplierId: z.string().optional(),
});

export const inventoryReportQuerySchema = z.object({
  warehouseId: z.string().optional(),
  expiryWithinDays: z.coerce.number().int().positive().default(30),
});

export type SalesReportQuery = z.infer<typeof salesReportQuerySchema>;
export type PurchaseReportQuery = z.infer<typeof purchaseReportQuerySchema>;
export type InventoryReportQuery = z.infer<typeof inventoryReportQuerySchema>;
