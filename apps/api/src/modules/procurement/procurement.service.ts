import { PurchaseOrderStatus } from '../../generated/prisma/enums';
import { ApiError } from '../../shared/ApiError';
import type { Pagination } from '../../shared/response';
import {
  procurementRepository,
  type PurchaseOrderDetail,
} from './procurement.repository';
import type {
  PurchaseOrderAttachmentDto,
  PurchaseOrderDetailDto,
  PurchaseOrderListItemDto,
} from './procurement.dto';
import type {
  CreatePurchaseOrderInput,
  ListPurchaseOrdersQuery,
  UpdatePurchaseOrderInput,
} from './procurement.validation';

function lineTotal(quantity: number, unitPrice: number) {
  return quantity * unitPrice;
}

function orderTotal(items: Array<{ quantity: number; unitPrice: number }>) {
  return items.reduce((sum, item) => sum + lineTotal(item.quantity, item.unitPrice), 0);
}

function toDetailDto(po: PurchaseOrderDetail): PurchaseOrderDetailDto {
  return {
    id: po.id,
    poNumber: po.poNumber,
    status: po.status,
    currency: po.currency,
    exchangeRateToBase: po.exchangeRateToBase,
    orderDate: po.orderDate,
    expectedArrival: po.expectedArrival,
    notes: po.notes,
    supplier: {
      id: po.supplier.id,
      name: po.supplier.name,
      country: po.supplier.country,
      currency: po.supplier.currency,
    },
    createdByName: po.createdBy.name,
    approvedByName: po.approvedBy?.name ?? null,
    items: po.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      productSku: item.product.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      receivedQuantity: item.receivedQuantity,
      lineTotal: lineTotal(item.quantity, item.unitPrice),
    })),
    attachments: po.attachments.map(
      (a): PurchaseOrderAttachmentDto => ({
        id: a.id,
        fileName: a.fileName,
        fileSize: a.fileSize,
        mimeType: a.mimeType,
        uploadedAt: a.uploadedAt,
      }),
    ),
    statusHistory: po.statusHistory.map((h) => ({
      status: h.status,
      note: h.note,
      changedAt: h.changedAt,
      changedByName: h.changedBy?.name ?? null,
    })),
    totalAmount: orderTotal(po.items),
    createdAt: po.createdAt,
    updatedAt: po.updatedAt,
  };
}

async function getOrThrow(id: string): Promise<PurchaseOrderDetail> {
  const po = await procurementRepository.findById(id);
  if (!po) {
    throw ApiError.notFound('Purchase order not found');
  }
  return po;
}

function assertStatus(po: PurchaseOrderDetail, allowed: string[]) {
  if (!allowed.includes(po.status)) {
    throw ApiError.badRequest(
      `Cannot perform this action while status is ${po.status}. Expected one of: ${allowed.join(', ')}`,
    );
  }
}

export const procurementService = {
  async list(
    query: ListPurchaseOrdersQuery,
  ): Promise<{ items: PurchaseOrderListItemDto[]; pagination: Pagination }> {
    const { total, orders } = await procurementRepository.list(query);
    return {
      items: orders.map((po) => ({
        id: po.id,
        poNumber: po.poNumber,
        supplierId: po.supplierId,
        supplierName: po.supplier.name,
        status: po.status,
        currency: po.currency,
        orderDate: po.orderDate,
        expectedArrival: po.expectedArrival,
        totalAmount: orderTotal(po.items),
        createdAt: po.createdAt,
      })),
      pagination: { page: query.page, pageSize: query.pageSize, total },
    };
  },

  async getDetail(id: string): Promise<PurchaseOrderDetailDto> {
    return toDetailDto(await getOrThrow(id));
  },

  async create(input: CreatePurchaseOrderInput, createdById: string): Promise<PurchaseOrderDetailDto> {
    const poNumber = await procurementRepository.nextPoNumber();
    const { items, supplierId, ...rest } = input;
    const created = await procurementRepository.create({
      ...rest,
      poNumber,
      supplier: { connect: { id: supplierId } },
      createdBy: { connect: { id: createdById } },
      items: { create: items },
    });
    return toDetailDto(created);
  },

  async update(id: string, input: UpdatePurchaseOrderInput): Promise<PurchaseOrderDetailDto> {
    const po = await getOrThrow(id);
    assertStatus(po, [PurchaseOrderStatus.DRAFT]);

    const { items, ...rest } = input;
    let updated = po;
    if (Object.keys(rest).length > 0) {
      updated = await procurementRepository.updateFields(id, rest);
    }
    if (items) {
      updated = (await procurementRepository.replaceItems(id, items))!;
    }
    return toDetailDto(updated);
  },

  async submit(id: string, userId: string) {
    const po = await getOrThrow(id);
    assertStatus(po, [PurchaseOrderStatus.DRAFT]);
    if (po.items.length === 0) {
      throw ApiError.badRequest('Cannot submit a purchase order with no items');
    }
    const updated = await procurementRepository.transitionStatus(
      id,
      PurchaseOrderStatus.PENDING_APPROVAL,
      userId,
    );
    return toDetailDto(updated!);
  },

  async approve(id: string, userId: string) {
    const po = await getOrThrow(id);
    assertStatus(po, [PurchaseOrderStatus.PENDING_APPROVAL]);
    const updated = await procurementRepository.transitionStatus(
      id,
      PurchaseOrderStatus.APPROVED,
      userId,
      undefined,
      { approvedBy: { connect: { id: userId } } },
    );
    return toDetailDto(updated!);
  },

  async reject(id: string, userId: string, reason: string) {
    const po = await getOrThrow(id);
    assertStatus(po, [PurchaseOrderStatus.PENDING_APPROVAL]);
    const updated = await procurementRepository.transitionStatus(
      id,
      PurchaseOrderStatus.REJECTED,
      userId,
      reason,
    );
    return toDetailDto(updated!);
  },

  async markOrdered(id: string, userId: string) {
    const po = await getOrThrow(id);
    assertStatus(po, [PurchaseOrderStatus.APPROVED]);
    const updated = await procurementRepository.transitionStatus(
      id,
      PurchaseOrderStatus.ORDERED,
      userId,
    );
    return toDetailDto(updated!);
  },

  async cancel(id: string, userId: string) {
    const po = await getOrThrow(id);
    assertStatus(po, [
      PurchaseOrderStatus.DRAFT,
      PurchaseOrderStatus.PENDING_APPROVAL,
      PurchaseOrderStatus.APPROVED,
      PurchaseOrderStatus.ORDERED,
    ]);
    const updated = await procurementRepository.transitionStatus(
      id,
      PurchaseOrderStatus.CANCELLED,
      userId,
    );
    return toDetailDto(updated!);
  },

  async deleteDraft(id: string) {
    const po = await getOrThrow(id);
    assertStatus(po, [PurchaseOrderStatus.DRAFT]);
    await procurementRepository.deleteDraft(id);
  },

  async addAttachment(
    id: string,
    file: { fileName: string; fileUrl: string; fileSize: number; mimeType: string },
  ) {
    await getOrThrow(id);
    return procurementRepository.addAttachment(id, file);
  },

  async getAttachmentForDownload(poId: string, attachmentId: string) {
    await getOrThrow(poId);
    const attachment = await procurementRepository.findAttachment(attachmentId);
    if (!attachment || attachment.purchaseOrderId !== poId) {
      throw ApiError.notFound('Attachment not found');
    }
    return attachment;
  },

  async removeAttachment(poId: string, attachmentId: string) {
    const attachment = await this.getAttachmentForDownload(poId, attachmentId);
    await procurementRepository.removeAttachment(attachmentId);
    return attachment;
  },
};
