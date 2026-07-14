import type { Request, Response } from 'express';
import { ok } from '../../shared/response';
import { expenseReportQuerySchema } from '../expenses/expenses.validation';
import { dateRangeQuerySchema } from '../finance/reports.validation';
import { reportsService } from './reports.service';
import {
  inventoryReportQuerySchema,
  purchaseReportQuerySchema,
  salesReportQuerySchema,
} from './reports.validation';
import { parseExportFormat, sendExcelExport, sendPdfExport } from './export.util';
import {
  cashFlowReportColumns,
  distributorReportColumns,
  expenseReportColumns,
  inventoryReportColumns,
  profitReportColumns,
  purchaseReportColumns,
  salesReportColumns,
  supplierReportColumns,
  taxReportColumns,
} from './export-columns';

/**
 * Phase 9 — every GET below accepts an optional `?format=pdf|excel` query param. When present,
 * the same data the JSON response would contain is instead streamed back as a file
 * (Content-Disposition: attachment) using the shared `export.util.ts` renderer and the
 * per-report column definitions in `export-columns.ts`. No new endpoints/permissions — this
 * reuses the exact same route, auth, and `reports:view` gate as the JSON response.
 */

export const reportsController = {
  async sales(req: Request, res: Response) {
    const query = salesReportQuerySchema.parse(req.query);
    const { data, pagination } = await reportsService.salesReport(query);
    const format = parseExportFormat(req.query.format);
    if (format === 'excel') {
      return sendExcelExport(res, 'sales', 'Sales Report', salesReportColumns, data.rows, [
        `Orders: ${data.summary.orderCount}`,
        `Grand total: ${data.summary.grandTotal.toFixed(2)}`,
      ]);
    }
    if (format === 'pdf') {
      return sendPdfExport(res, 'sales', 'Sales Report', salesReportColumns, data.rows, [
        `Orders: ${data.summary.orderCount}`,
        `Grand total: ${data.summary.grandTotal.toFixed(2)}`,
      ]);
    }
    ok(res, data, { pagination });
  },

  async purchases(req: Request, res: Response) {
    const query = purchaseReportQuerySchema.parse(req.query);
    const { data, pagination } = await reportsService.purchaseReport(query);
    const format = parseExportFormat(req.query.format);
    if (format === 'excel') {
      return sendExcelExport(res, 'purchases', 'Purchase Report', purchaseReportColumns, data.rows, [
        `Orders: ${data.summary.orderCount}`,
        `Grand total (base currency): ${data.summary.grandTotal.toFixed(2)}`,
      ]);
    }
    if (format === 'pdf') {
      return sendPdfExport(res, 'purchases', 'Purchase Report', purchaseReportColumns, data.rows, [
        `Orders: ${data.summary.orderCount}`,
        `Grand total (base currency): ${data.summary.grandTotal.toFixed(2)}`,
      ]);
    }
    ok(res, data, { pagination });
  },

  async inventory(req: Request, res: Response) {
    const query = inventoryReportQuerySchema.parse(req.query);
    const data = await reportsService.inventoryReport(query);
    const format = parseExportFormat(req.query.format);
    if (format === 'excel') {
      return sendExcelExport(res, 'inventory', 'Inventory Report', inventoryReportColumns, data.lines, [
        `Grand total valuation: ${data.grandTotal.toFixed(2)}`,
      ]);
    }
    if (format === 'pdf') {
      return sendPdfExport(res, 'inventory', 'Inventory Report', inventoryReportColumns, data.lines, [
        `Grand total valuation: ${data.grandTotal.toFixed(2)}`,
      ]);
    }
    ok(res, data);
  },

  async profit(req: Request, res: Response) {
    const range = dateRangeQuerySchema.parse(req.query);
    const data = await reportsService.profitReport(range);
    const format = parseExportFormat(req.query.format);
    const rows = [
      { label: 'Income', amount: data.income },
      { label: 'COGS', amount: data.cogs },
      { label: 'Expenses', amount: data.expenses },
      { label: 'Net profit', amount: data.netProfit },
    ];
    if (format === 'excel') {
      return sendExcelExport(res, 'profit', 'Profit & Loss Report', profitReportColumns, rows);
    }
    if (format === 'pdf') {
      return sendPdfExport(res, 'profit', 'Profit & Loss Report', profitReportColumns, rows);
    }
    ok(res, data);
  },

  async cashFlow(req: Request, res: Response) {
    const range = dateRangeQuerySchema.parse(req.query);
    const data = await reportsService.cashFlowReport(range);
    const format = parseExportFormat(req.query.format);
    const summary = [
      `Incoming: ${data.incoming.toFixed(2)}`,
      `Outgoing: ${data.outgoing.toFixed(2)}`,
      `Net cash flow: ${data.netCashFlow.toFixed(2)}`,
    ];
    if (format === 'excel') {
      return sendExcelExport(res, 'cash-flow', 'Cash Flow Report', cashFlowReportColumns, data.byDate, summary);
    }
    if (format === 'pdf') {
      return sendPdfExport(res, 'cash-flow', 'Cash Flow Report', cashFlowReportColumns, data.byDate, summary);
    }
    ok(res, data);
  },

  async suppliers(req: Request, res: Response) {
    const data = await reportsService.supplierReport();
    const format = parseExportFormat(req.query.format);
    if (format === 'excel') {
      return sendExcelExport(res, 'suppliers', 'Supplier Report', supplierReportColumns, data);
    }
    if (format === 'pdf') {
      return sendPdfExport(res, 'suppliers', 'Supplier Report', supplierReportColumns, data);
    }
    ok(res, data);
  },

  async distributors(req: Request, res: Response) {
    const data = await reportsService.distributorReport();
    const format = parseExportFormat(req.query.format);
    if (format === 'excel') {
      return sendExcelExport(res, 'distributors', 'Distributor Report', distributorReportColumns, data);
    }
    if (format === 'pdf') {
      return sendPdfExport(res, 'distributors', 'Distributor Report', distributorReportColumns, data);
    }
    ok(res, data);
  },

  async expenses(req: Request, res: Response) {
    const { from, to } = expenseReportQuerySchema.parse(req.query);
    const data = await reportsService.expenseReport(from, to);
    const format = parseExportFormat(req.query.format);
    const summary = [`Grand total: ${data.grandTotal.toFixed(2)}`];
    if (format === 'excel') {
      return sendExcelExport(res, 'expenses', 'Expense Report', expenseReportColumns, data.items, summary);
    }
    if (format === 'pdf') {
      return sendPdfExport(res, 'expenses', 'Expense Report', expenseReportColumns, data.items, summary);
    }
    ok(res, data);
  },

  async tax(req: Request, res: Response) {
    const data = await reportsService.taxReport();
    const format = parseExportFormat(req.query.format);
    const summary = [
      `Total invoiced: ${data.totalInvoicedAmount.toFixed(2)}`,
      `Estimated tax liability: ${data.estimatedTaxLiability.toFixed(2)}`,
    ];
    if (format === 'excel') {
      return sendExcelExport(res, 'tax', 'Tax Report', taxReportColumns, data.breakdown, summary);
    }
    if (format === 'pdf') {
      return sendPdfExport(res, 'tax', 'Tax Report', taxReportColumns, data.breakdown, summary);
    }
    ok(res, data);
  },
};
