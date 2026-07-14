import { prisma } from '../../database/prisma';
import { ApiError } from '../../shared/ApiError';
import { lineTotal } from '../../shared/pricing';
import { returnsRepository, type SalesReturnDetail } from './returns.repository';
import type { CreditNoteDto, SalesReturnDto } from './returns.dto';
import type { CreateCreditNoteInput, CreateReturnInput } from './returns.validation';

const RETURNABLE_STATUSES = ['SHIPPED', 'DELIVERED'];

function toReturnDto(r: SalesReturnDetail): SalesReturnDto {
  return {
    id: r.id,
    salesOrderId: r.salesOrderId,
    orderNumber: r.salesOrder.orderNumber,
    productId: r.productId,
    productName: r.product.name,
    quantity: r.quantity,
    reason: r.reason,
    hasCreditNote: r.creditNote !== null,
    createdAt: r.createdAt,
  };
}

function toCreditNoteDto(cn: {
  id: string;
  creditNoteNumber: string;
  invoiceId: string | null;
  salesReturnId: string | null;
  amount: number;
  reason: string | null;
  createdAt: Date;
}): CreditNoteDto {
  return { ...cn };
}

export const returnsService = {
  async list(): Promise<SalesReturnDto[]> {
    const returns = await returnsRepository.list();
    return returns.map(toReturnDto);
  },

  async listCreditNotes(): Promise<CreditNoteDto[]> {
    const notes = await returnsRepository.listCreditNotes();
    return notes.map(toCreditNoteDto);
  },

  async createReturn(input: CreateReturnInput): Promise<SalesReturnDto> {
    const order = await prisma.salesOrder.findUnique({
      where: { id: input.salesOrderId },
      include: { items: true },
    });
    if (!order) {
      throw ApiError.notFound('Sales order not found');
    }
    if (!RETURNABLE_STATUSES.includes(order.status)) {
      throw ApiError.badRequest(
        `Cannot return items from a sales order in status ${order.status}. Expected SHIPPED or DELIVERED.`,
      );
    }
    const orderItem = order.items.find((i) => i.productId === input.productId);
    if (!orderItem) {
      throw ApiError.badRequest('This product was not part of the sales order');
    }

    const alreadyReturned = await returnsRepository.returnedQuantityForItem(
      input.salesOrderId,
      input.productId,
    );
    const remaining = orderItem.quantity - (alreadyReturned._sum.quantity ?? 0);
    if (input.quantity > remaining) {
      throw ApiError.badRequest(
        `Cannot return ${input.quantity}: only ${remaining} of ${orderItem.quantity} remain returnable`,
      );
    }

    let restockData;
    if (input.restock) {
      const product = await prisma.product.findUniqueOrThrow({ where: { id: input.productId } });
      restockData = {
        warehouseId: input.restock.warehouseId,
        lotNumber: input.restock.lotNumber,
        productId: input.productId,
        quantity: input.quantity,
        costPrice: product.costPrice,
      };
    }

    const created = await returnsRepository.create(
      {
        salesOrder: { connect: { id: input.salesOrderId } },
        product: { connect: { id: input.productId } },
        quantity: input.quantity,
        reason: input.reason,
      },
      restockData,
    );
    return toReturnDto(created);
  },

  async createCreditNote(input: CreateCreditNoteInput): Promise<CreditNoteDto> {
    let amount = input.amount;
    let invoiceId = input.invoiceId;

    if (input.salesReturnId) {
      const salesReturn = await prisma.salesReturn.findUnique({
        where: { id: input.salesReturnId },
        include: { creditNote: true },
      });
      if (!salesReturn) {
        throw ApiError.notFound('Sales return not found');
      }
      if (salesReturn.creditNote) {
        throw ApiError.conflict('This return already has a credit note');
      }

      const order = await prisma.salesOrder.findUniqueOrThrow({
        where: { id: salesReturn.salesOrderId },
        include: { items: true, distributor: { include: { pricingGroup: true } } },
      });

      if (amount === undefined) {
        const orderItem = order.items.find((i) => i.productId === salesReturn.productId)!;
        const { total } = lineTotal({
          unitPrice: orderItem.unitPrice,
          quantity: orderItem.quantity,
          itemDiscountPercent: orderItem.discount,
          pricingGroupDiscountPercent: order.distributor.pricingGroup?.discountPercent ?? 0,
        });
        const effectiveUnitPrice = total / orderItem.quantity;
        amount = effectiveUnitPrice * salesReturn.quantity;
      }

      // Auto-link to the order's active invoice (if one exists) so the invoice's balance
      // reflects the credit — otherwise this credit note would be bookkept nowhere.
      if (!invoiceId) {
        const activeInvoice = await prisma.invoice.findFirst({
          where: { salesOrderId: order.id, status: { not: 'CANCELLED' } },
        });
        invoiceId = activeInvoice?.id;
      }
    }

    if (amount === undefined) {
      throw ApiError.badRequest('amount is required when not creating a credit note from a return');
    }

    const creditNoteNumber = await returnsRepository.nextCreditNoteNumber();
    const created = await returnsRepository.createCreditNote({
      creditNoteNumber,
      amount,
      reason: input.reason,
      invoice: invoiceId ? { connect: { id: invoiceId } } : undefined,
      salesReturn: input.salesReturnId ? { connect: { id: input.salesReturnId } } : undefined,
    });
    return toCreditNoteDto(created);
  },
};
