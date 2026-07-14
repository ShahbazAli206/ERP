import { SalesOrderStatus } from '../../generated/prisma/enums';
import { ApiError } from '../../shared/ApiError';
import type { Pagination } from '../../shared/response';
import { invoicesRepository, type InvoiceDetail } from './invoices.repository';
import type { InvoiceDetailDto, InvoiceListItemDto } from './invoices.dto';
import { orderTotal } from '../../shared/pricing';
import { salesOrdersRepository } from './salesOrders.repository';
import type { CreateInvoiceInput, RecordPaymentInput } from './invoices.validation';

const NOT_INVOICEABLE_STATUSES: string[] = [SalesOrderStatus.DRAFT, SalesOrderStatus.CANCELLED];

function toDetailDto(invoice: InvoiceDetail): InvoiceDetailDto {
  const creditNotesTotal = invoice.creditNotes.reduce((sum, cn) => sum + cn.amount, 0);
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    salesOrderId: invoice.salesOrderId,
    orderNumber: invoice.salesOrder.orderNumber,
    distributorName: invoice.salesOrder.distributor.name,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    totalAmount: invoice.totalAmount,
    paidAmount: invoice.paidAmount,
    status: invoice.status,
    currency: invoice.salesOrder.currency,
    payments: invoice.payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      method: p.method,
      paymentDate: p.paymentDate,
      reference: p.reference,
    })),
    creditNotesTotal,
    balanceDue: invoice.totalAmount - invoice.paidAmount - creditNotesTotal,
  };
}

export const invoicesService = {
  async list(query: {
    page: number;
    pageSize: number;
    status?: string;
    search?: string;
    sortBy: 'issueDate' | 'dueDate' | 'invoiceNumber';
    sortOrder: 'asc' | 'desc';
  }): Promise<{ items: InvoiceListItemDto[]; pagination: Pagination }> {
    const { total, invoices } = await invoicesRepository.list(query as never);
    return {
      items: invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        salesOrderId: inv.salesOrderId,
        orderNumber: inv.salesOrder.orderNumber,
        distributorName: inv.salesOrder.distributor.name,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        totalAmount: inv.totalAmount,
        paidAmount: inv.paidAmount,
        status: inv.status,
      })),
      pagination: { page: query.page, pageSize: query.pageSize, total },
    };
  },

  async getDetail(id: string): Promise<InvoiceDetailDto> {
    const invoice = await invoicesRepository.findById(id);
    if (!invoice) {
      throw ApiError.notFound('Invoice not found');
    }
    return toDetailDto(invoice);
  },

  async create(input: CreateInvoiceInput): Promise<InvoiceDetailDto> {
    const order = await salesOrdersRepository.findById(input.salesOrderId);
    if (!order) {
      throw ApiError.notFound('Sales order not found');
    }
    if (NOT_INVOICEABLE_STATUSES.includes(order.status)) {
      throw ApiError.badRequest(`Cannot invoice a sales order in status ${order.status}`);
    }
    const existing = await invoicesRepository.findActiveBySalesOrderId(order.id);
    if (existing) {
      throw ApiError.conflict(`Sales order already has an active invoice (${existing.invoiceNumber})`);
    }

    const totalAmount = orderTotal({
      items: order.items,
      pricingGroupDiscountPercent: order.distributor.pricingGroup?.discountPercent ?? 0,
      orderDiscountPercent: order.discountPercent,
    });

    const invoiceNumber = await invoicesRepository.nextInvoiceNumber();
    const issueDate = new Date();
    const dueDate = new Date(issueDate.getTime() + input.dueInDays * 24 * 60 * 60 * 1000);

    const created = await invoicesRepository.create({
      invoiceNumber,
      issueDate,
      dueDate,
      totalAmount,
      status: 'ISSUED',
      salesOrder: { connect: { id: order.id } },
    });
    return toDetailDto(created);
  },

  async recordPayment(invoiceId: string, input: RecordPaymentInput): Promise<InvoiceDetailDto> {
    const invoice = await invoicesRepository.findById(invoiceId);
    if (!invoice) {
      throw ApiError.notFound('Invoice not found');
    }
    if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
      throw ApiError.badRequest(`Cannot record a payment against an invoice in status ${invoice.status}`);
    }
    const newPaidAmount = invoice.paidAmount + input.amount;
    if (newPaidAmount > invoice.totalAmount + 0.01) {
      throw ApiError.badRequest(
        `Payment of ${input.amount} would exceed the remaining balance of ${invoice.totalAmount - invoice.paidAmount}`,
      );
    }
    const newStatus = newPaidAmount >= invoice.totalAmount - 0.01 ? 'PAID' : 'PARTIALLY_PAID';

    const updated = await invoicesRepository.recordPayment(
      invoiceId,
      invoice.salesOrder.distributorId,
      invoice.salesOrder.currency,
      input,
      newStatus,
    );
    return toDetailDto(updated!);
  },
};
